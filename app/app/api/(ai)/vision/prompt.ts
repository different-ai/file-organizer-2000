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
              text: "Extract text from image. Write in markdown. If there's a drawing, describe it.",
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
