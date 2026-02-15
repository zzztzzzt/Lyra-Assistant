interface Props {
  cancelAction: () => void;
  customClasses: string;
}

const CancelBtn: React.FC<Props> = ({ cancelAction, customClasses }) => {
  return (
    <button
      onClick={cancelAction}
      className={`
        ${ customClasses }
        flex items-center justify-center w-16 h-16 rounded-full
        text-gray-400 hover:text-red-400
        border-4 border-red-300 hover:border-none
        bg-white hover:bg-white/0
        hover:scale-110 active:scale-95
        cursor-pointer transition-all ease-in-out duration-600
      `}
      aria-label="close"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
};

export default CancelBtn;