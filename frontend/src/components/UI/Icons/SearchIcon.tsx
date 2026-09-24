import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export const SearchIcon = ({ width = 24, height = 24, ...props }: Props) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M21.0002 21.0002L16.6602 16.6602M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke="#7E8480"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
