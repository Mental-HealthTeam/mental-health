import { BrainIcon, FireIcon, HeartIcon, StarIcon } from "../components/UI/Icons";

type Tag = {
  id: string;
  text: string;
  description: string;
  icon: React.ComponentType;
};

export const tags: Tag[] = [
  {
    id: 'anxiety',
    text: "Тривожність",
    description: "Проблеми з тривожністю",
    icon: BrainIcon,
  },
  {
    id: 'burnout',
    text: "Вигорання",
    description: "Проблеми з вигоранням",
    icon: FireIcon,
  },
  {
    id: 'relationships',
    text: "Стосунки",
    description: "Проблеми у стосунках",
    icon: HeartIcon,
  },
  {
    id: 'self-esteem',
    text: "Самооцінка",
    description: "Проблеми з самооцінкою",
    icon: StarIcon,
  }
];
