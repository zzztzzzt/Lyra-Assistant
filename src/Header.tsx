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
  handlePredict: () => void;
}

const Header: React.FC<Props> = ({ colorM, setColorM, accentM, isDarkMode, setIsDarkMode, handlePredict }) => {
  const [isMoonCardHovered, setIsMoonCardHovered] = useState<boolean>(false);

  return(
    <div>
      <div className="flex flex-col md:flex-row items-center justify-center max-md:space-y-3 md:gap-3 xl:gap-5 py-8 md:py-12 xl:py-14 text-2xl xl:text-4xl text-default-gray font-prosto-one">
        <div className="decorative-line" style={{ backgroundImage: `linear-gradient(270deg in oklch, ${accentM}, ${ isDarkMode? "black" : "white" })` }}></div>
        
        <div>
          Lyra
          <a
            className={`duration-600 ${ isDarkMode? "hover:!text-white" : "hover:!text-black" }`}
            style={{ color: accentM }} href="https://github.com/zzztzzzt/Lyra-AI"
          >
            &nbsp;1.6&nbsp;
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

        <div className="decorative-line" style={{ backgroundImage: `linear-gradient(90deg in oklch, ${accentM}, ${ isDarkMode? "black" : "white" })` }}></div>
      </div>

      <div className="xl:max-w-320 xl:mx-auto xl:flex xl:flex-row xl:justify-between xl:items-center">
        <div className="mx-auto h-50 w-full max-w-120 grid grid-cols-3 px-6 gap-6">
          <div
            className={`card-shape-header card-header px-4 ${ isDarkMode? "dark-card-hover" : "light-card-hover" }`}
            style={{ boxShadow: `0 0 10px 3px oklch(from ${ accentM } l c h / 0.5)` }}
          >
            <div className="fill-current w-full h-auto">
              <HuggingFaceIcon />
            </div>
          </div>
          <div
            className={`card-shape-header card-header px-1 ${ isDarkMode? "dark-card-hover" : "light-card-hover" }`}
            style={{ boxShadow: `0 0 10px 3px oklch(from ${ accentM } l c h / 0.5)` }}
          >
            <div className="fill-current w-full h-auto">
              <LyraAssistantIcon />            
            </div>
          </div>
          <div className="card-shape-header p-7" style={{ backgroundColor: accentM }}>
            <div className={`w-full h-full duration-600 ${ isDarkMode? "bg-black" : "bg-white" }`}></div>
          </div>
        </div>

        <div className="mx-auto xl:-mt-5.5 py-8 xl:py-0 px-6 xl:px-3 xl:w-full max-xl:max-w-120"><ColorController color={colorM} setColor={setColorM} /></div>

        <div className="mx-auto h-50 w-full max-w-120 grid grid-cols-3 px-6 gap-6">
          <div
            className={`card-shape-header card-header px-4 justify-center font-prosto-one text-white text-4xl bg-default-gray
              ${ isDarkMode? "dark-card-hover hover:bg-black" : "light-card-hover hover:bg-white" }
            `}
            style={{ boxShadow: `0 0 10px 3px oklch(from ${ accentM } l c h / 0.5)` }}
            onClick={handlePredict}
          >
            GO
          </div>
          <div
            className={`card-shape-header card-header px-1 justify-center ${ isDarkMode? "dark-card-hover" : "light-card-hover" }`}
            style={{ boxShadow: `0 0 10px 3px oklch(from ${ accentM } l c h / 0.5)` }}
            onMouseEnter={() => setIsMoonCardHovered(true)}
            onMouseLeave={() => setIsMoonCardHovered(false)}
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            <div
              className={`rounded-full flex items-center justify-center duration-600
                ${ isMoonCardHovered? isDarkMode? "bg-white" : "bg-black" : "bg-default-gray" }
                ${ isDarkMode? "h-12 w-12 shadow-sun" : "h-15 w-15" }
              `}
            >
              <div
                className={`rounded-full duration-600
                  ${ isDarkMode? "ml-0 bg-black h-0 w-0" : "ml-6 bg-white h-9 w-9" }
                `}
              ></div>
            </div>
          </div>
          <div
            className={`card-shape-header card-header px-4 justify-center font-prosto-one text-2xl ${ isDarkMode? "dark-card-hover" : "light-card-hover" }`}
            style={{ boxShadow: `0 0 10px 3px oklch(from ${ accentM } l c h / 0.5)` }}
          >
            Tools
          </div>
        </div>

        <div></div>
      </div>
    </div>
  );
};

export default Header;