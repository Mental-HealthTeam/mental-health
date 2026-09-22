import "./Hero.scss";
import { Button } from "../UI/Button";
import { ArrowRightIcon, SearchIcon, SparkIcon } from "../UI/Icons";
import { useRef, useState } from "react";
import { tags } from "../../constants/tags";

export const Hero = () => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<null | HTMLInputElement>(null);
  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__region-title">
          <div className="hero__badge">
            <SparkIcon />
            <p className="hero__badge-text">Розумний підбір за допомогою ШІ</p>
          </div>

          <h1 className="hero__title">Знайди свого психолога</h1>

          <p className="hero__subtitle">
            AI допоможе підібрати фахівця під твою потребу за кілька хвилин
          </p>
        </div>

        <form className="hero__search" onSubmit={(e) => handleSubmit(e)}>
          <div className="hero__search-field">
            <input
              type="text"
              ref={inputRef}
              aria-label="Опишіть свій стан або запит"
              className="hero__search-input"
              placeholder="Опишіть свій стан або запит..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button
              type="submit"
              className="hero__search-button"
              variant="primary"
              size="large"
              endIcon={<ArrowRightIcon />}
            >
              Підібрати
            </Button>
            <SearchIcon className="hero__search-icon" />
          </div>
        </form>

        <div className="hero__region-tags">
          <h3 className="hero__tags-title">Популярні запити:</h3>
          <div className="hero__tags">
            {tags.map((item) => {
              const Icon = item.icon;

              return (
                <Button
                  className="hero__tag"
                  variant="tag"
                  startIcon={<Icon />}
                  key={item.id}
                  onClick={() => {
                    setInputValue(item.description);
                    inputRef.current?.focus();
                  }}
                >
                  {item.text}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
