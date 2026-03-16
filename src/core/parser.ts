// src/core/parser.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';

export interface SlideNode {
  type: 'cover' | 'content';
  title: string;
  isContinuation?: boolean; // 【新增】：标记是否为 --- 产生的延续页
  elements: any[];
}

export function parseMarkdownToSlides(mdContent: string): SlideNode[] {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMath);
  
  const ast = processor.parse(mdContent);
  
  const slides: SlideNode[] = [];
  let currentSlide: SlideNode | null = null;

  for (const node of ast.children) {
    if (node.type === 'heading' && (node.depth === 1 || node.depth === 2)) {
      const titleText = (node.children as any[])
        .filter((c: any) => c.type === 'text' || c.type === 'inlineCode')
        .map((c: any) => c.value)
        .join('');

      currentSlide = {
        type: node.depth === 1 ? 'cover' : 'content',
        title: titleText,
        isContinuation: false, // 正常标题页
        elements: []
      };
      
      slides.push(currentSlide);
    } 
    // 【核心新增】：遇到分割线 ---，开启新的一页 PPT
    else if (node.type === 'thematicBreak') {
      if (currentSlide) {
        // 创建新页，完美继承当前章节的标题
        currentSlide = {
          type: 'content',
          title: currentSlide.title,
          isContinuation: true, // 标记为延续页
          elements: []
        };
        slides.push(currentSlide);
      }
    } 
    else if (currentSlide) {
      currentSlide.elements.push(node);
    }
  }

  return slides;
}