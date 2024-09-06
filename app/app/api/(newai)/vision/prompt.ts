export const generateMessages = (model: string, image: string): any => {
  switch (model) {
    case "gpt-4o":
    default:
      return [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract text from image. If there's a drawing, describe it. Respond with only the extracted text or description.",
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
