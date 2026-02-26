export interface BaseBlock {
  id: string;
  type: "text" | "image";
}

export type TextBlockStyle = "h1" | "h2" | "h3" | "p";

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
  style: TextBlockStyle;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  source: string;
  height: number;
  width: number;
}

export type Block = TextBlock | ImageBlock;
