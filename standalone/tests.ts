import {
  generateTags,
  generateFolderSuggestion,
  generateRelationships,
  generateDocumentTitle,
  classifyDocument,
} from "./aiService";

async function exampleUsage() {
  const content =
    "This is a sample document content that needs to be processed by the AI services. You'll get an invoice";
  const fileName = "sample_document.txt";
  const tags = ["invoice", "receipt", "report"];
  const folders = ["invoices", "receipts", "reports"];
  const templateNames = [
    "invoiceTemplate",
    "receiptTemplate",
    "reportTemplate",
  ];
  const files = [
    { name: "invoice1.pdf", content: "Invoice content 1" },
    { name: "receipt1.pdf", content: "Receipt content 1" },
    { name: "report1.pdf", content: "Report content 1" },
  ];

  const generatedTags = await generateTags(content, fileName, tags);
  console.log("Generated Tags:", generatedTags);

  const suggestedFolder = await generateFolderSuggestion(
    content,
    fileName,
    folders
  );
  console.log("Suggested Folder:", suggestedFolder);

  const similarFiles = await generateRelationships(content, files);
  console.log("Similar Files:", similarFiles);

  const documentTitle = await generateDocumentTitle(content);
  console.log("Document Title:", documentTitle);

  const documentType = await classifyDocument(content, fileName, templateNames);
  console.log("Document Type:", documentType);
}

exampleUsage();
