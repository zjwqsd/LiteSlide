import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math'; // 引入数学公式插件

export interface SlideNode {
  type: 'cover' | 'content';
  title: string;
  elements: any[];
}

export function parseMarkdownToSlides(mdContent: string): SlideNode[] {
  // 在处理流水线中加入 remarkMath
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
        elements: []
      };
      
      slides.push(currentSlide);
    } else if (currentSlide) {
      currentSlide.elements.push(node);
    }
  }

  return slides;
}