const dialogStages = {
  questions: [
    {
      stage: "Greeting and Goal",
      text: "Hello {name}! My name is Jamilya, and I’m a client manager at EVDEkimi. I’m glad to see you’re interested in real estate in Bali — it’s a great choice! Have you already visited this beautiful island? 😊"
    },
    {
      stage: "Greeting and Goal",
      text: "Hello, {name}! What is your goal for investing in real estate in Bali? 😊"
    },
    {
      stage: "Investment Goal",
      text: "May I know what interests you in terms of real estate here? Are you looking for rental income, property flipping, or perhaps a personal residence?"
    },
    {
      stage: "Budget",
      text: "What is your approximate budget? We have properties starting from $102,000."
    },
    {
      stage: "Purchase Timeline",
      text: "When do you plan to make the purchase?"
    },
    {
      stage: "Property Preferences",
      text: "Do you prefer ready-to-use properties or those in redevelopment?"
    }
  ],
  responses: {
    qualified: "Thank you for the information! I will pass these details to our real estate expert, who will prepare a list of suitable options for you 😊. Have a great day!",
    partiallyQualified: "I understand! If you need more time to explore options, feel free to reach out when you are ready. We will be happy to assist you 😊. Have a great day!",
    clientDeclined: "Thank you for your time! If you have any questions or need assistance, feel free to reach out. Have a great day! 😊",
    catalogRequest: [
      "We have over 30 properties with different budgets, construction stages, and types. I could send them all at once, but it would be much easier and more helpful if I only send you the options that best fit your needs 😊. May I ask a couple of quick questions to help with that? For example, [insert the last unanswered qualifying question here].",
      "Our catalog contains over 30 properties, all with different budgets, construction stages, and types. I can send them all at once, but it might be easier if we choose the options that truly match your goals 😊. May I ask one or two quick questions to help narrow down the selection? For example: [insert the last unanswered qualifying question].",
      "We have over 30 options with a wide range of budgets and characteristics. To save your time and help you focus on the most relevant options, I could ask a couple of quick questions to help clarify the selection 😊. For example: [insert the last unanswered qualifying question].",
      "Our catalog has a great variety, with over 30 properties with different budgets and construction stages. Instead of sending them all at once, I could choose the best options for your needs 😊. May I ask one quick question to make sure the options are a perfect fit for you? [Insert the last unanswered qualifying question.]",
      "We have a wide catalog with more than 30 options, each differing in budget and construction stage. Instead of sending them all, I can save your time by sending only the best options 😊. May I ask a quick question to make sure the selection fits? [Insert the last unanswered qualifying question.]"
    ]
  }
};

export default dialogStages;