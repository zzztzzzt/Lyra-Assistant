interface Props {
  handleSubmit: React.FormEventHandler<HTMLFormElement>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  error: string | null;
}

const ChatInputArea: React.FC<Props> = ({
  handleSubmit,
  input,
  setInput,
  isSending,
  error
}) => {
  return (
    <div className="max-w-210 mx-auto px-6">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-full py-1.5 px-2.5 focus-within:border-slate-400 transition-all"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Lyra anything ..."
          className="max-sm:w-full sm:flex-1 bg-transparent pl-5 pr-2 py-3 outline-none text-chat-lyra placeholder:invisible sm:placeholder:visible"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="bg-slate-900 text-white p-3 rounded-full disabled:bg-slate-100 disabled:text-slate-300 transition-all hover:scale-105 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="3">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
};

export default ChatInputArea;