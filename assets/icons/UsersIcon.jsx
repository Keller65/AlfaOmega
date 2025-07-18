import Svg, { Path } from "react-native-svg"
const SvgComponent = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    fill={props.color || "currentColor"}
    className="size-6"
    viewBox="0 0 24 24"
    width={props.size || 24}
    height={props.size || 24}
    {...props}
  >
    <Path
      fillRule="evenodd"
      d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0Zm7.5 3a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm-13.5 0a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm4.06 5.367A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75a12.69 12.69 0 0 1-6.337-1.684.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
      clipRule="evenodd"
    />
    <Path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047Zm15.144 5.135a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
  </Svg>
)
export default SvgComponent