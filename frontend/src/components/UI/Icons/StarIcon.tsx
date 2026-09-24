import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export const StarIcon = ({ width = 16, height = 16, ...props }: Props) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.00004 1.33331L10.06 5.50665L14.6667 6.17998L11.3334 9.42665L12.12 14.0133L8.00004 11.8466L3.88004 14.0133L4.66671 9.42665L1.33337 6.17998L5.94004 5.50665L8.00004 1.33331Z"
        fill="#FFCC33"
        stroke="#FFCC33"
        strokeWidth="0.333333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
