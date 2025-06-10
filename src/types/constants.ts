import { GameListType } from "./enums"

export const STATUS_CONFIG = {
  [GameListType.PLAYING]: {
    label: "Currently Playing",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgLight: "bg-green-50",
    type: "PLAYING",
    value: GameListType.PLAYING,
  },
  [GameListType.PLAN_TO_PLAY]: {
    label: "Plan to Play",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50",
    type: "PLAN_TO_PLAY",
    value: GameListType.PLAN_TO_PLAY,
  },
  [GameListType.COMPLETED]: {
    label: "Completed",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgLight: "bg-purple-50",
    type: "COMPLETED",
    value: GameListType.COMPLETED,
  },
  [GameListType.ON_HOLD]: {
    label: "On Hold",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgLight: "bg-yellow-50",
    type: "ON_HOLD",
    value: GameListType.ON_HOLD,
  },
  [GameListType.DROPPED]: {
    label: "Dropped",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgLight: "bg-red-50",
    type: "DROPPED",
    value: GameListType.DROPPED,
  },
} as const
