export const rollDice = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1
}
