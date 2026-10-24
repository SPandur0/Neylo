// Denne fil genererer simple styles dynamisk, når komponenter skal ændre størrelse, farve eller gennemsigtighed baseret på props eller animation.
export const squareSize = size => ({ width: size, height: size });
export const opacityStyle = opacity => ({ opacity });
export const borderColorStyle = borderColor => ({ borderColor });
export const textColorStyle = color => ({ color });
