import { Fragment, type ReactNode } from "react";

type Render = (children: ReactNode, key: number) => ReactNode;

const DEFAULTS: Record<string, Render> = {
  i: (c, k) => <i key={k}>{c}</i>,
  b: (c, k) => <b key={k}>{c}</b>,
  ja: (c, k) => (
    <span key={k} lang="ja">
      {c}
    </span>
  ),
  en: (c, k) => (
    <span key={k} lang="en">
      {c}
    </span>
  ),
};

/**
 * Render a translated string with light markup: <i>, <b>, <ja>, <en>, plus any
 * named tags you pass, e.g. rich(t("x"), { link: (c) => <Link href="/a">{c}</Link> }).
 * Tags do not nest; that keeps translations easy to write and to check.
 */
export function rich(text: string, components: Record<string, Render> = {}): ReactNode {
  const all = { ...DEFAULTS, ...components };
  const out: ReactNode[] = [];
  const re = /<(\w+)>([\s\S]*?)<\/\1>|<br\s*\/?>/g;
  let last = 0;
  let k = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    if (m[0].startsWith("<br")) out.push(<br key={k++} />);
    else {
      const render = all[m[1]];
      out.push(render ? render(m[2], k++) : <Fragment key={k++}>{m[2]}</Fragment>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return out;
}
