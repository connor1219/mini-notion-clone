import { Block } from "./block";

export interface Page {
  id: string;
  name: string;
  blocks: Block[];
}
