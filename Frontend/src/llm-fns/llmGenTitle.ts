export async function llmGenTitle(url: string, conversationId: string, previousTalk: string[]) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: getWholePrompt(previousTalk),
        conversation_id: conversationId,
        is_system_call: true,
      }),
    });

    if (!response.ok) throw new Error("Service temporarily unavailable");

    const data = await response.json();

    return data.reply;
  } catch (err) {
    throw new Error("LLM API Connection failed");
  }
}

function getWholePrompt(chatHistory: string[]): string {
  const restoredHistory: string = reproduceChat(chatHistory);

  return ` 
    please name a title ( don't be too long, but it needs to be meaningful ) for below conversation : 
    ( PLEASE NOTE THAT ONLY REPLY THE TITLE ( THE TITLE I TELL YOU TO MAKE ) ON YOUR NEXT REPLY )
    ${ restoredHistory }
  `;
}

function reproduceChat(userConversation: string[]): string {
  return userConversation
    .map((msg, i) => {
      const role = i % 2 === 0 ? "User" : "AI";
      return `${role}: ${msg}`;
    })
    .join("\n");
}
