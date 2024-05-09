export const generateMessages = (model: string, image: string): any => {
  switch (model) {
    case "gpt-4-turbo":
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
