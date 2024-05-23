import { createOllamaInstance, configureTask } from "./models";
import { generateDocumentTitle, guessRelevantFolder } from "../app/aiService";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import fetch from "node-fetch";
import fs from "fs";
import * as path from "path";

async function analyzeTitle(title: string, content: string): Promise<string> {
  configureTask("analyze_title", "llama3");

  const prompt = `Analyze the quality of the generated title "${title}" for the following document content:

    ${content}

    Provide feedback on the relevance, specificity, and conciseness of the title. Suggest improvements if necessary.`;

  const response = await generateText({
    model: openai("gpt-4o"),
    prompt,
  });

  return response.text.trim();
}

async function analyzeFolder(
  folder: string | null,
  content: string,
  fileName: string,
  existingFolders: string[]
): Promise<string> {
  configureTask("analyze_folder", "llama3");

  const prompt = `Analyze the appropriateness of the suggested folder "${folder}" for the following document:

    File Name: ${fileName}
    Content: ${content}

    Existing Folders: ${existingFolders.join(", ")}

    Provide feedback on the relevance of the suggested folder based on the document content and file name. If no suitable folder was found, comment on whether creating a new folder is appropriate.`;

  const response = await generateText({
    model: openai("gpt-4o"),
    prompt,
  });

  return response.text.trim();
}

async function runTests(testDataset: TestCase[]): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const totalTests = testDataset.length;

  for (let i = 0; i < totalTests; i++) {
    const testCase = testDataset[i];
    try {
      const { content, fileName, existingFolders } = testCase;

      const generatedTitle = await generateDocumentTitle(content);
      const titleAnalysis = await analyzeTitle(generatedTitle, content);

      const suggestedFolder = await guessRelevantFolder(
        content,
        fileName,
        existingFolders
      );
      const folderAnalysis = await analyzeFolder(
        suggestedFolder,
        content,
        fileName,
        existingFolders
      );

      const isValidPath = suggestedFolder
        ? path.isAbsolute(suggestedFolder)
        : false;
      const isValidFileName = /^[^<>:"/\\|?*]+$/g.test(fileName);

      results.push({
        generatedTitle,
        titleAnalysis,
        suggestedFolder,
        folderAnalysis,
        isValidPath,
        isValidFileName,
      });
    } catch (error) {
      console.error("Error processing test case:", error);
      results.push({
        generatedTitle: "Error",
        titleAnalysis: "Error",
        suggestedFolder: null,
        folderAnalysis: "Error",
        isValidPath: false,
        isValidFileName: false,
      });
    }

    // Log progress
    console.log(`Processed ${i + 1} of ${totalTests} test cases.`);
  }

  return results;
}

function generateStatistics(testResults: TestResult[]): void {
  const totalTests = testResults.length;
  const successfulTitles = testResults.filter((result) =>
    result.titleAnalysis.includes("appropriate")
  ).length;
  const successfulFolders = testResults.filter((result) =>
    result.folderAnalysis.includes("appropriate")
  ).length;
  const validPaths = testResults.filter((result) => result.isValidPath).length;
  const validFileNames = testResults.filter(
    (result) => result.isValidFileName
  ).length;
  const failedTests = testResults.filter(
    (result) => result.generatedTitle === "Error"
  ).length;

  const titleSuccessRate = (successfulTitles / totalTests) * 100;
  const folderSuccessRate = (successfulFolders / totalTests) * 100;
  const pathValidity = (validPaths / totalTests) * 100;
  const fileNameValidity = (validFileNames / totalTests) * 100;

  const titleLengths = testResults
    .filter((result) => result.generatedTitle !== "Error")
    .map((result) => result.generatedTitle.length);
  const averageTitleLength =
    titleLengths.reduce((sum, length) => sum + length, 0) / titleLengths.length;

  const folderCounts: Record<string, number> = {};
  testResults.forEach((result) => {
    if (result.suggestedFolder) {
      folderCounts[result.suggestedFolder] =
        (folderCounts[result.suggestedFolder] || 0) + 1;
    }
  });
  const mostCommonFolder =
    Object.entries(folderCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  console.log("Test Statistics:");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Title Success Rate: ${titleSuccessRate.toFixed(2)}%`);
  console.log(`Folder Success Rate: ${folderSuccessRate.toFixed(2)}%`);
  console.log(`Average Title Length: ${averageTitleLength.toFixed(2)}`);
  console.log(`Most Common Folder: ${mostCommonFolder}`);
  console.log(`Path Validity: ${pathValidity.toFixed(2)}%`);
  console.log(`File Name Validity: ${fileNameValidity.toFixed(2)}%`);
  console.log(`Failed Tests: ${failedTests}`);

  // Generate CSV report
  const csvHeader =
    "GeneratedTitle,TitleAnalysis,SuggestedFolder,FolderAnalysis,IsValidPath,IsValidFileName\n";
  const csvRows = testResults.map((result) => {
    const {
      generatedTitle,
      titleAnalysis,
      suggestedFolder,
      folderAnalysis,
      isValidPath,
      isValidFileName,
    } = result;
    return `"${generatedTitle}","${titleAnalysis}","${
      suggestedFolder || ""
    }","${folderAnalysis}",${isValidPath},${isValidFileName}\n`;
  });

  const csvContent = csvHeader + csvRows.join("");
  fs.writeFileSync("test_report.csv", csvContent);
  console.log("CSV report generated: test_report.csv");
}

interface TestCase {
  content: string;
  fileName: string;
  existingFolders: string[];
}

interface TestResult {
  generatedTitle: string;
  titleAnalysis: string;
  suggestedFolder: string | null;
  folderAnalysis: string;
  isValidPath: boolean;
  isValidFileName: boolean;
}
async function generateTestCase(directoryPath: string): Promise<TestCase[]> {
  const testCases: TestCase[] = [];
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const existingFolders = fs
      .readdirSync(directoryPath)
      .filter((f) => fs.statSync(path.join(directoryPath, f)).isDirectory());

    testCases.push({
      content,
      fileName: file,
      existingFolders,
    });
  }

  return testCases;
}

async function main() {
  // Get the directory path from user input arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Please provide the directory path as an argument.");
    process.exit(1);
  }
  const directoryPath = args[0];

  // Configure ollama instance
  createOllamaInstance("llama3", { baseURL: "http://localhost:11434/api" });

  // Configure tasks with the desired models
  configureTask("name", "llama3");
  configureTask("folders", "llama3");

  const testDataset = await generateTestCase(directoryPath);

  const testResults = await runTests(testDataset);
  generateStatistics(testResults);
}

main().catch((error) => {
  console.error("Error:", error);
});
