/** 本地图片预览；调用方在城市关闭、重生成或身份清理时 dispose。 */
export function createCityShare(root: ShadowRoot, options: {
  prepare: () => Promise<{ blob: Blob; width: number; height: number }>;
  range: string;
  filename: string;
}): { open(): Promise<void>; dispose(): void } {
  const style = document.createElement('style');
  style.textContent = `
    .cy-share { box-sizing:border-box; width:min(920px,92vw); max-height:88vh; overflow:auto; padding:24px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:18px; color:var(--fgColor-default,#1f2328); background:var(--bgColor-default,#fff); font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .cy-share::backdrop { background:rgba(15,27,29,.48); }
    .cy-share * { box-sizing:border-box; } .cy-share header,.cy-share footer { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
    .cy-share header { justify-content:space-between; } .cy-share h2 { margin:0; font-size:21px; } .cy-share p { margin:10px 0; }
    .cy-share img { display:block; max-width:100%; max-height:46vh; margin:12px auto; object-fit:contain; border-radius:8px; background:var(--bgColor-muted,#f6f8fa); }
    .cy-share textarea { display:block; width:100%; min-height:120px; margin:6px 0 16px; padding:12px; resize:vertical; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:9px; font:inherit; color:inherit; background:var(--bgColor-default,#fff); }
    .cy-share button { padding:7px 14px; border:1px solid var(--borderColor-default,#d1d9e0); border-radius:8px; background:var(--bgColor-muted,#f6f8fa); color:inherit; font:inherit; cursor:pointer; }
    .cy-share button:disabled { opacity:.5; cursor:default; } .cy-share button:focus-visible,.cy-share textarea:focus-visible { outline:2px solid #268f80; outline-offset:3px; }
    .cy-share .cy-share-save { background:#245b3c; color:white; } .cy-share [hidden] { display:none; }
    .cy-share output { display:block; margin:12px 0; white-space:pre-line; } .cy-share output:empty { display:none; }
    .cy-share .cy-share-note { color:var(--fgColor-muted,#59636e); font-size:12px; }
  `;
  const dialog = document.createElement('dialog');
  dialog.className = 'cy-share'; dialog.setAttribute('aria-label', '分享这座城');
  dialog.innerHTML = `
    <header><h2>分享这座城</h2><button type="button" class="cy-share-close">关闭</button></header>
    <output role="status" aria-live="polite"></output>
    <div class="cy-share-ready" hidden>
      <img alt="贡献之城图片预览">
      <p class="cy-share-size cy-share-note"></p>
      <label>分享配文<textarea aria-label="分享配文"></textarea></label>
      <footer><button type="button" class="cy-share-save">保存 PNG</button><button type="button" class="cy-share-copy">复制配文</button><button type="button" class="cy-share-system" hidden>分享图片与配文</button></footer>
      <p class="cy-share-note">图片在本机生成，不会自动上传。配文可自行修改。</p>
    </div><a hidden></a>`;
  root.append(style, dialog);
  const image = dialog.querySelector('img')!;
  const caption = dialog.querySelector('textarea')!;
  const status = dialog.querySelector('output')!;
  const ready = dialog.querySelector<HTMLElement>('.cy-share-ready')!;
  const share = dialog.querySelector<HTMLButtonElement>('.cy-share-system')!;
  const copy = dialog.querySelector<HTMLButtonElement>('.cy-share-copy')!;
  const download = dialog.querySelector('a')!;
  let generation = 0, disposed = false, url = '', file: File | undefined;
  const release = () => {
    image.removeAttribute('src'); download.removeAttribute('href');
    if (url) URL.revokeObjectURL(url);
    url = ''; file = undefined; ready.hidden = true; share.hidden = true;
  };
  const close = () => {
    generation++; release(); caption.value = ''; status.textContent = '';
    if (dialog.open) dialog.close();
  };
  dialog.querySelector<HTMLButtonElement>('.cy-share-close')!.onclick = close;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.querySelector<HTMLButtonElement>('.cy-share-save')!.onclick = () => {
    if (disposed || !file || !dialog.open) return;
    download.click(); status.textContent = '已开始保存图片。';
  };
  copy.onclick = async () => {
    const token = generation;
    try {
      await navigator.clipboard.writeText(caption.value);
      if (!disposed && token === generation && dialog.open) status.textContent = '配文已复制。';
    } catch {
      if (!disposed && token === generation && dialog.open) {
        status.textContent = '未能复制，请在配文框中手动选择复制。'; caption.focus(); caption.select();
      }
    }
  };
  share.onclick = async () => {
    if (disposed || !file || !dialog.open) return;
    status.textContent = '';
    const token = generation; share.disabled = true;
    try {
      // 此前没有异步等待，直接使用按钮点击的用户手势。
      await navigator.share({ files: [file], text: caption.value });
      if (!disposed && token === generation && dialog.open) status.textContent = '已交给系统分享。';
    } catch (error) {
      if (!disposed && token === generation && dialog.open) {
        status.textContent = error instanceof DOMException && error.name === 'AbortError'
          ? '' : '暂时无法分享，请保存图片或复制配文后分享。';
      }
    } finally { if (!disposed && token === generation) share.disabled = false; }
  };
  return {
    async open() {
      if (disposed) return;
      close(); const token = generation;
      status.textContent = '正在准备图片…'; dialog.showModal();
      try {
        const result = await options.prepare();
        if (disposed || token !== generation || !dialog.open) return;
        file = new File([result.blob], options.filename, { type: result.blob.type || 'image/png' });
        url = URL.createObjectURL(result.blob); image.src = url;
        await image.decode();
        if (disposed || token !== generation || !dialog.open) return;
        download.href = url; download.download = options.filename;
        dialog.querySelector('.cy-share-size')!.textContent = `${result.width} × ${result.height} 像素`;
        caption.value = `我用 CodeYears，把 ${options.range} 年的 GitHub 贡献变成了一座城市。\n代码岁月，自成风景。\nhttps://github.com/wxy/CodeYears\n#CodeYears #GitHub`;
        try { share.hidden = !(typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })); }
        catch { share.hidden = true; }
        share.disabled = false; ready.hidden = false; status.textContent = '';
      } catch {
        if (!disposed && token === generation && dialog.open) {
          release(); status.textContent = '图片准备失败，请关闭后重试。';
        }
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true; close(); dialog.remove(); style.remove();
    },
  };
}
