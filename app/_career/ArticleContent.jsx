import { articleBlocks } from '../../lib/career';
import styles from './Career.module.css';

export default function ArticleContent({ body }) {
  return <div className={styles.prose}>{articleBlocks(body).map((block, index) => {
    if (block.type === 'heading') return <h2 id={block.id} key={index}>{block.text}</h2>;
    if (block.type === 'list') return <ul key={index}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
    if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>;
    return <p key={index}>{block.text}</p>;
  })}</div>;
}
