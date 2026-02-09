import { useState } from "react";
import type { OklchState } from "./App";
import ColorController from "./components/ColorController";
import GithubIcon from "./components/GitHubIcon";
import HuggingFaceIcon from "./components/HuggingFaceIcon";
import LyraAssistantIcon from "./components/LyraAssistantIcon";

interface Props {
  colorM: OklchState;
  setColorM: React.Dispatch<React.SetStateAction<OklchState>>;
  accentM: string;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<Props> = ({ colorM, setColorM, accentM, isDarkMode, setIsDarkMode }) => {
  const [isMoonCardHovered, setIsMoonCardHovered] = useState<boolean>(false);

  return(
    <div>
      <div className="flex flex-col md:flex-row items-center justify-center max-md:space-y-3 md:gap-3 xl:gap-5 py-8 md:py-12 text-2xl xl:text-4xl text-default-gray font-prosto-one">
        <div>
          Lyra
          <a
            className={`duration-600 ${ isDarkMode? "hover:!text-white" : "hover:!text-black" }`}
            style={{ color: accentM }} href="https://github.com/zzztzzzt/Lyra-AI"
          >
            &nbsp;1.5&nbsp;
          </a>
          stable
        </div>
        <div>
          ( trained with
          <a
            className={`duration-600 ${ isDarkMode? "hover:!text-white" : "hover:!text-black" }`}
            style={{ color: accentM }}
            href="https://github.com/LuxDL/Lux.jl"
          >
            &nbsp;Lux.jl&nbsp;
          </a>
          )
        </div>
        <div className="flex">
          <div className="h-7 xl:h-9 w-7 xl:w-9 mr-2 xl:mr-3 fill-current">
            <GithubIcon />
          </div>
          <a
            className={`duration-600 ${ isDarkMode? "hover:!text-white" : "hover:!text-black" }`}
            style={{ color: accentM }}
            href="https://github.com/zzztzzzt/Lyra-AI"
          >
            GitHub {'>'}
          </a>
        </div>
      </div>

      <div className="xl:max-w-375 xl:mx-auto xl:flex xl:flex-row xl:justify-between xl:items-center">
        <div className="mx-auto h-50 w-full max-w-120 grid grid-cols-3 px-6 gap-6">
          <div
            className={`card-shape-header card-header px-5 ${ isDarkMode? "dark-card-hover" : "light-card-hover" }`}
            style={{ boxShadow: `0 0 10px 3px ${accentM}` }}
          >
            <div className="fill-current w-full h-auto">
              <HuggingFaceIcon />
            </div>
          </div>
          <div
            className={`card-shape-header card-header px-1 ${ isDarkMode? "dark-card-hover" : "light-card-hover" }`}
            style={{ boxShadow: `0 0 10px 3px ${accentM}` }}
          >
            <div className="fill-current w-full h-auto">
              <LyraAssistantIcon />            
            </div>
          </div>
          <div className="card-shape-header p-7" style={{ backgroundColor: accentM }}>
            <div className={`w-full h-full duration-600 ${ isDarkMode? "bg-black" : "bg-white" }`}></div>
          </div>
        </div>

        <div className="mx-auto py-8 xl:py-0 px-6 xl:w-full max-xl:max-w-120 flex items-center"><ColorController color={colorM} setColor={setColorM} /></div>

        <div className="mx-auto h-50 w-full max-w-120 grid grid-cols-3 px-6 gap-6">
          <div
            className={`card-shape-header card-header px-4 justify-center font-prosto-one text-white text-4xl bg-default-gray
              ${ isDarkMode? "dark-card-hover hover:bg-black" : "light-card-hover hover:bg-white" }
            `}
            style={{ boxShadow: `0 0 10px 3px ${accentM}` }}
          >
            GO
          </div>
          <div
            className={`card-shape-header card-header px-1 justify-center ${ isDarkMode? "dark-card-hover" : "light-card-hover" }`}
            style={{ boxShadow: `0 0 10px 3px ${accentM}` }}
            onMouseEnter={() => setIsMoonCardHovered(true)}
            onMouseLeave={() => setIsMoonCardHovered(false)}
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            <div
              className={`h-15 w-15 rounded-full flex items-center justify-center duration-600
                ${ isMoonCardHovered? isDarkMode? "bg-white" : "bg-black" : "bg-default-gray" }
              `}
            >
              <div
                className={`rounded-full duration-600
                  ${ isDarkMode? "ml-0 bg-black h-11 w-11" : "ml-6 bg-white h-9 w-9" }
                `}
              ></div>
            </div>
          </div>
          <div
            className={`card-shape-header card-header px-4 justify-center font-prosto-one text-2xl ${ isDarkMode? "dark-card-hover" : "light-card-hover" }`}
            style={{ boxShadow: `0 0 10px 3px ${accentM}` }}
          >
            Undo
          </div>
        </div>

        <div></div>
      </div>
    </div>
  );
};

export default Header;