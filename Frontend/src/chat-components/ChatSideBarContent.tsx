import type { ConversationSummary } from "@/ChatLyraPage";
import CancelBtn from "@/components/CancelBtn";

interface Props {
  currentLLM: string;
  conversations: ConversationSummary[];
  loadConversation: ( targetConversationId: string ) => Promise<void>;
  isLoadingConversation: boolean;
  isDeletingConversation: string | null;
  handleDeleteConversation: ( targetConversationId: string ) => Promise<void>;
  conversationId: string | null;
}

const ChatSideBarContent: React.FC<Props> = ({
  currentLLM,
  conversations,
  loadConversation,
  isLoadingConversation,
  isDeletingConversation,
  handleDeleteConversation,
  conversationId
}) => {
  return (
    <>
      <div className="h-20 mx-5 mt-5 chat-side-bar-btn-style">
          <span>Current Model :&nbsp;</span>{ currentLLM }
      </div>
      {conversations.map((conversation) => (
        <div
          key={conversation.conversation_id}
          className="group relative h-20 w-[calc(100%-2.5rem)] mx-5 mt-5"
        >
          <button
            type="button"
            onClick={() => void loadConversation(conversation.conversation_id)}
            disabled={isLoadingConversation || Boolean(isDeletingConversation)}
            className={`h-full w-full px-5 group-hover:pr-17 chat-side-bar-btn-style flex-col space-y-0.5 duration-800 ${
              conversationId === conversation.conversation_id
                ? "ring ring-slate-400 shadow-md"
                : ""
            } ${isLoadingConversation || isDeletingConversation ? "opacity-70" : "cursor-pointer"}`}
          >
            <span className="w-full truncate">{conversation.title || "Untitled chat"}</span>
            <span className="w-full truncate text-xs text-slate-500">
              {conversation.preview || "No preview"}
            </span>
          </button>

          <CancelBtn
            cancelAction={() => void handleDeleteConversation(conversation.conversation_id)}
            customClasses={`absolute top-1/2 right-2 -translate-y-1/2 scale-75 transition-all duration-600 ${
              isDeletingConversation === conversation.conversation_id
                ? "opacity-60 pointer-events-none"
                : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
            }`}
          />
        </div>
      ))}
    </>
  );
};

export default ChatSideBarContent;