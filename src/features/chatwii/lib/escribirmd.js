// src/features/chatwii/lib/escribirmd.js
// Parseador premium de Markdown a HTML seguro y interactivo
// Homologado con el proyecto ChatWii Web

import { imgwii, Mensaje, Notificacion } from '@widev';

if (typeof window !== 'undefined') {
  window.Mensaje = window.Mensaje || Mensaje;
  window.Notificacion = window.Notificacion || Notificacion;
}

export const CUSTOM_ICONS = {
  'corazon': '<i class="fas fa-heart po_ico_red"></i>',
  'heart': '<i class="fas fa-heart po_ico_red"></i>',
  'estrella': '<i class="fas fa-star po_ico_yellow"></i>',
  'star': '<i class="fas fa-star po_ico_yellow"></i>',
  'si': '<i class="fas fa-circle-check po_ico_green"></i>',
  'check': '<i class="fas fa-circle-check po_ico_green"></i>',
  'no': '<i class="fas fa-circle-xmark po_ico_red"></i>',
  'times': '<i class="fas fa-circle-xmark po_ico_red"></i>',
  'maletin': '<i class="fas fa-briefcase po_ico_mco"></i>',
  'briefcase': '<i class="fas fa-briefcase po_ico_mco"></i>',
  'foco': '<i class="fas fa-lightbulb po_ico_yellow"></i>',
  'idea': '<i class="fas fa-lightbulb po_ico_yellow"></i>',
  'lightbulb': '<i class="fas fa-lightbulb po_ico_yellow"></i>',
  'grafico': '<i class="fas fa-chart-line po_ico_cyan"></i>',
  'chart': '<i class="fas fa-chart-line po_ico_cyan"></i>',
  'usuario': '<i class="fas fa-user-tie po_ico_gold"></i>',
  'user': '<i class="fas fa-user-tie po_ico_gold"></i>',
  'cruz': '<i class="fas fa-cross po_ico_mco"></i>',
  'cross': '<i class="fas fa-cross po_ico_mco"></i>',
  'biblia': '<i class="fas fa-book-bible po_ico_mco"></i>',
  'bible': '<i class="fas fa-book-bible po_ico_mco"></i>',
  'oracion': '<i class="fas fa-hands-praying po_ico_gold"></i>',
  'pray': '<i class="fas fa-hands-praying po_ico_gold"></i>',
  'paloma': '<i class="fas fa-dove po_ico_cyan"></i>',
  'dove': '<i class="fas fa-dove po_ico_cyan"></i>',
  'alerta': '<i class="fas fa-triangle-exclamation po_ico_warning"></i>',
  'warning': '<i class="fas fa-triangle-exclamation po_ico_warning"></i>',
  'info': '<i class="fas fa-circle-info po_ico_cyan"></i>',
  'herramienta': '<i class="fas fa-screwdriver-wrench po_ico_mco"></i>',
  'tool': '<i class="fas fa-screwdriver-wrench po_ico_mco"></i>',
  'enlace': '<i class="fas fa-link po_ico_cyan"></i>',
  'link': '<i class="fas fa-link po_ico_cyan"></i>'
};

export const wiSanihtml = (html) => {
  if (!html) return '';
  let str = html.toString();
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  str = str.replace(/(\bon[a-z]+\s*=\s*"[^"]*")/gi, '');
  str = str.replace(/(\bon[a-z]+\s*=\s*'[^']*')/gi, '');
  str = str.replace(/(\bon[a-z]+\s*=\s*[^\s>]+)/gi, '');
  str = str.replace(/<\/?(iframe|embed|object|applet)\b[^>]*>/gi, '');
  str = str.replace(/href\s*=\s*(['"]?)\s*javascript:[^>]*\1/gi, 'href="#"');
  return str;
};

export const countWords = (html) => {
  if (!html) return { words: 0, min: 1 };
  const t = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean);
  return { words: t.length, min: Math.max(1, Math.ceil(t.length / 200)) };
};

const mdCache = new Map();

const formatInline = (text) => {
  if (!text) return '';
  let formatted = text;

  const segments = [];
  formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
    const id = segments.length;
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    segments.push(`<code>${escaped}</code>`);
    return `:::INLINECODE_${id}:::`;
  });

  formatted = formatted
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>');

  formatted = formatted
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<figure class="po_figure"><img alt="$1" src="$2" /><figcaption class="po_figcaption">$1</figcaption></figure>')
    .replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, url) => {
      if ((url.includes('youtube.com') || url.includes('youtu.be')) && (url.includes('#normal') || url.includes('?normal=1'))) {
        const cleanUrl = url.replace(/(?:#|\?)normal$/, '');
        return `<a href="${cleanUrl}" class="yt_link_normal" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    });

  Object.keys(CUSTOM_ICONS).forEach(key => {
    const regex = new RegExp(`:${key}:`, 'gim');
    formatted = formatted.replace(regex, CUSTOM_ICONS[key]);
  });

  formatted = formatted
    .replace(/:fa-([a-z0-9-]+):/gim, '<i class="fas fa-$1"></i>')
    .replace(/:far-([a-z0-9-]+):/gim, '<i class="far fa-$1"></i>')
    .replace(/:fab-([a-z0-9-]+):/gim, '<i class="fab fa-$1"></i>');

  segments.forEach((htmlCode, id) => {
    formatted = formatted.replace(`:::INLINECODE_${id}:::`, htmlCode);
  });

  return formatted;
};

export const mdToHtml = (md) => {
  if (!md) return '';
  if (mdCache.has(md)) {
    return mdCache.get(md);
  }

  const codeBlocks = [];
  let processedMd = md.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
    const id = codeBlocks.length;
    codeBlocks.push({ lang: lang.trim(), code: code });
    return `\n:::CODEBLOCK_${id}:::\n`;
  });

  const lines = processedMd.split('\n');
  const result = [];
  let inList = false;
  let inOList = false;
  let inTable = false;
  let inQuote = false;
  let quoteLines = [];

  const flushQuote = () => {
    if (quoteLines.length === 0) return;
    const firstLine = quoteLines[0].trim();
    const alertMatch = firstLine.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]$/i);
    
    if (alertMatch) {
      const type = alertMatch[1].toUpperCase();
      let icon = 'fas fa-info-circle';
      let title = 'Nota';
      if (type === 'TIP') { icon = 'fas fa-lightbulb'; title = 'Consejo'; }
      else if (type === 'WARNING') { icon = 'fas fa-triangle-exclamation'; title = 'Advertencia'; }
      else if (type === 'IMPORTANT') { icon = 'fas fa-circle-exclamation'; title = 'Importante'; }
      else if (type === 'CAUTION') { icon = 'fas fa-ban'; title = 'Precaución'; }
      
      const content = quoteLines.slice(1).map(l => formatInline(l)).join('<br/>');
      result.push(`<div class="po_alert po_alert_${type.toLowerCase()}"><div class="po_alert_title"><i class="${icon}"></i> ${title}</div><p>${content}</p></div>`);
    } else {
      const content = quoteLines.map(l => formatInline(l)).join('<br/>');
      result.push(`<blockquote>${content}</blockquote>`);
    }
    quoteLines = [];
  };

  lines.forEach(line => {
    const trimLine = line.trim();

    const cbMatch = trimLine.match(/^:::CODEBLOCK_(\d+):::$/);
    if (cbMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOList) { result.push('</ol>'); inOList = false; }
      if (inTable) { result.push('</table></div>'); inTable = false; }
      if (inQuote) { flushQuote(); inQuote = false; }

      const idx = parseInt(cbMatch[1], 10);
      const block = codeBlocks[idx];
      const uniqueId = 'code_' + Math.random().toString(36).substr(2, 9);
      
      const escapedCode = block.code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      result.push(`
        <div class="chatwii-codeblock-container">
          <div class="chatwii-codeblock-header">
            <span class="chatwii-codeblock-lang">
              ${block.lang || 'code'}
              <span class="chatwii-codeblock-editable-badge"><i class="fas fa-pen"></i> Editable</span>
            </span>
            <button class="chatwii-codeblock-copy" data-code-id="${uniqueId}">
              <i class="far fa-copy"></i> <span class="chatwii-btn-text">Copiar</span>
            </button>
          </div>
          <pre class="chatwii-codeblock-content" id="${uniqueId}"><code contenteditable="true" spellcheck="false">${escapedCode.trim()}</code></pre>
        </div>`);
      return;
    }

    const hrMatch = trimLine.match(/^\s*([\-\*_])\s*(?:\1\s*){2,}$/);
    if (hrMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOList) { result.push('</ol>'); inOList = false; }
      if (inTable) { result.push('</table></div>'); inTable = false; }
      if (inQuote) { flushQuote(); inQuote = false; }
      result.push('<hr class="po_hr"/>');
      return;
    }

    const quoteMatch = line.match(/^\s*>\s*(.*)$/);
    if (quoteMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOList) { result.push('</ol>'); inOList = false; }
      if (inTable) { result.push('</table></div>'); inTable = false; }
      inQuote = true;
      quoteLines.push(quoteMatch[1]);
      return;
    } else if (inQuote) {
      flushQuote();
      inQuote = false;
    }

    if (trimLine.startsWith('|') && trimLine.endsWith('|')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOList) { result.push('</ol>'); inOList = false; }
      if (!inTable) {
        result.push('<div class="po_table_wrap"><table>');
        inTable = true;
      }
      if (trimLine.match(/^\|?[\s\-\|:]+\|?$/)) return;
      
      const cells = trimLine.split('|').filter((c, i, a) => (i > 0 && i < a.length - 1));
      const isHeader = inTable && result[result.length - 1].includes('<table>');
      const tag = isHeader ? 'th' : 'td';
      result.push('<tr>' + cells.map(c => `<${tag}>${formatInline(c.trim())}</${tag}>`).join('') + '</tr>');
      return;
    } else if (inTable) {
      result.push('</table></div>');
      inTable = false;
    }

    const headerMatch = line.match(/^\s*(#+)\s+(.*?)(?:\s*\{\#([a-zA-Z0-9_-]+)\})?\s*$/);
    if (headerMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOList) { result.push('</ol>'); inOList = false; }
      const level = Math.min(headerMatch[1].length, 6);
      const title = formatInline(headerMatch[2].trim());
      const id = headerMatch[3];
      result.push(id ? `<h${level} id="${id}">${title}</h${level}>` : `<h${level}>${title}</h${level}>`);
      return;
    }

    const listMatch = line.match(/^\s*[\-\*]\s+(.*)$/);
    const oListMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    
    if (listMatch) {
      if (inOList) { result.push('</ol>'); inOList = false; }
      if (!inList) { result.push('<ul>'); inList = true; }
      let text = listMatch[1];
      let isChecked = false;
      let isUnchecked = false;
      
      if (text.startsWith('[ ] ')) {
        isUnchecked = true;
        text = text.slice(4);
      } else if (text.startsWith('[x] ')) {
        isChecked = true;
        text = text.slice(4);
      }
      
      const inlineText = formatInline(text);
      if (isUnchecked) {
        result.push(`<li class="po_todo_li"><input type="checkbox" class="po_todo_check" disabled> ${inlineText}</li>`);
      } else if (isChecked) {
        result.push(`<li class="po_todo_li"><input type="checkbox" class="po_todo_check" checked disabled> ${inlineText}</li>`);
      } else {
        result.push(`<li>${inlineText}</li>`);
      }
    } else if (oListMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (!inOList) { result.push('<ol>'); inOList = true; }
      result.push(`<li>${formatInline(oListMatch[2])}</li>`);
    } else {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOList) { result.push('</ol>'); inOList = false; }
      if (trimLine === '') return;
      
      if (line.match(/^\s*<(h[1-6]|ul|ol|li|blockquote|img|hr|div|table|tr|th|td|figure|figcaption)/)) {
        result.push(line);
      } else {
        result.push(`<p>${formatInline(line)}</p>`);
      }
    }
  });

  if (inTable) result.push('</table></div>');
  if (inList) result.push('</ul>');
  if (inOList) result.push('</ol>');
  if (inQuote) flushQuote();
  
  const finalHtml = result.join('\n');

  if (mdCache.size >= 5) {
    const firstKey = mdCache.keys().next().value;
    mdCache.delete(firstKey);
  }
  mdCache.set(md, finalHtml);

  return finalHtml;
};

export const procesarHtml = (html) => {
  if (!html) return '';

  let mod = html;

  mod = mod.replace(/<button[^>]*?class="po_yt_btn"[^>]*?data-yt="([a-zA-Z0-9_-]+)"[^>]*>([\s\S]*?)<\/button>/gi, (match, ytId, innerHtml) => {
    const cleanInner = innerHtml.replace(/<i\s+class=(['"])(.*?)\1\s+style=(['"])[^>]*?\3/gi, '<i class="$2 po_ico_youtube"');
    return `<a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener noreferrer" class="po_yt_link">${cleanInner}</a>`;
  });

  mod = mod.replace(/<a\s+([^>]*?)href=(['"])(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^'"]*?)(?:#|\?)normal\2([^>]*?)>/gi, (match, before, quote, cleanUrl, after) => {
    const rest = (before + ' ' + after).trim();
    if (rest.includes('class=')) {
      return `<a href="${cleanUrl}" ${rest.replace(/class=(['"])(.*?)\1/gi, 'class=$1$2 yt_link_normal$1')}>`;
    } else {
      return `<a href="${cleanUrl}" class="yt_link_normal" ${rest}>`;
    }
  });

  mod = mod
    .replace(/<hr style="border:none;border-top:1px solid var\(--brd\);margin:2vh 0"\/?>/gi, '<hr class="po_hr" />')
    .replace(/(<input[^>]*?type="checkbox"[^>]*?)style="margin-right:\s*0\.5vh;?"/gi, '$1class="po_todo_check"');

  mod = mod.replace(/<i\s+class=(['"])(.*?)\1\s+style=(['"])color:\s*(.*?);?\3><\/i>/gi, (match, q1, classes, q2, color) => {
    let colorClass = '';
    const c = color.trim().toLowerCase();
    if (c === '#fe0149' || c === '#ff3849') colorClass = 'po_ico_red';
    else if (c === '#ffb636' || c === '#ffc107') colorClass = 'po_ico_yellow';
    else if (c === '#3cd741') colorClass = 'po_ico_green';
    else if (c === '#0edeff') colorClass = 'po_ico_cyan';
    else if (c === '#e0a910') colorClass = 'po_ico_gold';
    else if (c === 'var(--warning)') colorClass = 'po_ico_warning';
    else if (c === 'var(--mco)') colorClass = 'po_ico_mco';
    return `<i class="${classes} ${colorClass}"></i>`;
  });

  mod = mod.replace(/<img\s+([^>]*?)src=(['"])(.*?)\2([^>]*?)>/gi, (match, before, quote, src, after) => {
    const rest = (before + ' ' + after).trim();
    if (rest.includes('data-src=')) return match;
    const svg = `src="${imgwii.svg}"`;
    if (rest.includes('class=')) {
      return `<img ${svg} data-src="${src}" ${rest.replace(/class=(['"])(.*?)\1/gi, 'class=$1$2 wi_skeleton img_fade$1')}>`;
    } else {
      return `<img ${svg} data-src="${src}" class="wi_skeleton img_fade" ${rest}>`;
    }
  });

  mod = mod.replace(
    /(<figure[\s\S]*?<\/figure>)|<img([^>]*?)alt="([^"]+)"([^>]*?)>/gi,
    (match, figureBlock, before, alt, after) => {
      if (figureBlock) return figureBlock;
      if (!alt?.trim()) return match;
      return `<figure class="po_figure">${match}<figcaption class="po_figcaption">${alt.trim()}</figcaption></figure>`;
    }
  );

  return mod;
};
