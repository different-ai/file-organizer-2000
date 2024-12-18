export const generateMessages = (model: string, image: string, customInstructions: string): any => {
  const defaultInstruction = "Extract text from image. If there's a drawing, describe it.";
  const responseInstruction = "Respond with only the extracted text or description.";
  
  // Combine default with custom instructions if provided
  const promptText = customInstructions?.trim() 
    ? `${defaultInstruction} ${customInstructions} ${responseInstruction}`
    : `${defaultInstruction} ${responseInstruction}`;

  switch (model) {
    case "gpt-4o":
    default:
      return [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            },
            {
              type: "image",
              image: image,
            },
          ],
        },
      ];
  }
};
