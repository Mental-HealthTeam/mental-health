import "./Hero.scss";
import heroSparkle from "../../assets/decorations/hero-sparkle.svg";
import heroSearch from "../../assets/decorations/hero-search.svg";
import { Button } from "../UI/Button";
import { ArrowRightIcon } from "../UI/Icons";
import { useRef, useState } from "react";
import { tags } from "../../constants/tags";

export const Hero = () => {
  const [inputValue, setInputValue] = useState("");
  const reff = useRef<null | HTMLInputElement>(null);
  const startSelectionProcess = () => {
    if (inputValue) {
      setInputValue("");
    }
  };

  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__region-title">
          <span className="hero__badge">
            <img
              src={heroSparkle}
              alt="hero-sparkle"
              className="hero__badge-icon"
            />
            <h3 className="hero__badge-text">
              Розумний підбір за допомогою ШІ
            </h3>
          </span>

          <h1 className="hero__title">Знайди свого психолога</h1>

          <p className="hero__subtitle">
            AI допоможе підібрати фахівця під твою потребу за кілька хвилин
          </p>
        </div>

        <form
          className="hero__search"
          action="#"
          onSubmit={(e) => {
            e.preventDefault();
            startSelectionProcess();
          }}
        >
          <div className="hero__search-field">
            <input
              type="text"
              ref={reff}
              className="hero__search-input"
              placeholder="Опишіть свою проблему, або стан самопочуття..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button
              className="hero__search-button"
              href="#ai-search"
              variant="primary"
              size="large"
              endIcon={<ArrowRightIcon />}
              onClick={startSelectionProcess}
            >
              Підібрати
            </Button>
            <img
              src={heroSearch}
              alt="hero-search"
              className="hero__search-icon"
            />
          </div>
        </form>

        <div className="hero__region-tags">
          <h3 className="hero__tags-title">Популярні запити:</h3>
          <div className="hero__tags">
            {tags.map((item) => (
              <button
                className="hero__tag"
                onClick={() => {
                  setInputValue(item.description);
                  reff.current?.focus();
                }}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
