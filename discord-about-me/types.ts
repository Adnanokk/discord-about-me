
export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface Skill {
  name: string;
  level: number;
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
}
