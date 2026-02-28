"use strict";var VoiceBoard=(()=>{var s=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var g=Object.getOwnPropertyNames;var m=Object.prototype.hasOwnProperty;var h=(e,t)=>{for(var o in t)s(e,o,{get:t[o],enumerable:!0})},u=(e,t,o,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of g(t))!m.call(e,n)&&n!==o&&s(e,n,{get:()=>t[n],enumerable:!(i=b(t,n))||i.enumerable});return e};var x=e=>u(s({},"__esModule",{value:!0}),e);var v={};h(v,{default:()=>f});function d(e,t){let o=t.includes("right"),i=t.includes("bottom");return`
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #1f2937;
    }

    .vb-hidden { display: none !important; }

    .vb-trigger {
      position: fixed;
      ${i?"bottom: 20px":"top: 20px"};
      ${o?"right: 20px":"left: 20px"};
      background: ${e};
      color: white;
      border: none;
      border-radius: 24px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .vb-trigger:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }

    .vb-modal {
      position: fixed;
      ${i?"bottom: 70px":"top: 70px"};
      ${o?"right: 20px":"left: 20px"};
      width: 360px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 999998;
      overflow: hidden;
    }

    .vb-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .vb-modal-title {
      font-weight: 600;
      font-size: 15px;
    }

    .vb-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
      padding: 0 4px;
    }

    .vb-form {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .vb-input, .vb-textarea, .vb-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      background: white;
      box-sizing: border-box;
    }

    .vb-input:focus, .vb-textarea:focus, .vb-select:focus {
      border-color: ${e};
      box-shadow: 0 0 0 2px ${e}33;
    }

    .vb-textarea {
      resize: vertical;
      min-height: 60px;
    }

    .vb-honeypot {
      position: absolute;
      left: -9999px;
      opacity: 0;
      height: 0;
    }

    .vb-submit {
      background: ${e};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .vb-submit:hover { opacity: 0.9; }
    .vb-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .vb-message {
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      text-align: center;
    }

    .vb-success {
      background: #ecfdf5;
      color: #065f46;
    }

    .vb-error {
      background: #fef2f2;
      color: #991b1b;
    }

    .vb-powered {
      text-align: center;
      padding: 8px;
      border-top: 1px solid #f3f4f6;
    }

    .vb-powered a {
      color: #9ca3af;
      font-size: 11px;
      text-decoration: none;
    }

    .vb-powered a:hover { color: #6b7280; }
  `}async function l(){let e=[];e.push(`${screen.width}x${screen.height}x${screen.colorDepth}`),e.push(Intl.DateTimeFormat().resolvedOptions().timeZone),e.push(navigator.language),e.push(navigator.platform);try{let r=document.createElement("canvas"),a=r.getContext("2d");a&&(a.textBaseline="top",a.font="14px Arial",a.fillText("VoiceBoard fingerprint",2,2),e.push(r.toDataURL().slice(-50)))}catch{}let t=e.join("|"),i=new TextEncoder().encode(t),n=await crypto.subtle.digest("SHA-256",i);return Array.from(new Uint8Array(n)).map(r=>r.toString(16).padStart(2,"0")).join("")}var p={_container:null,_shadow:null,_config:null,init(e){if(this._config={position:"bottom-right",theme:"light",accentColor:"#6366f1",triggerText:"Feedback",apiBase:"",...e},!e.projectId){console.error("[VoiceBoard] projectId is required");return}if(!this._config.apiBase){let t=document.querySelectorAll('script[src*="widget"]');for(let o of t){let i=o.src;if(i.includes("voiceboard")||i.includes("widget"))try{let n=new URL(i);this._config.apiBase=n.origin}catch{}}}this._mount()},_mount(){this._container=document.createElement("div"),this._container.id="voiceboard-widget",document.body.appendChild(this._container),this._shadow=this._container.attachShadow({mode:"open"});let e=document.createElement("style");e.textContent=d(this._config.accentColor,this._config.position),this._shadow.appendChild(e);let t=document.createElement("button");t.className="vb-trigger",t.textContent=this._config.triggerText,t.addEventListener("click",()=>this._toggleModal()),this._shadow.appendChild(t);let o=document.createElement("div");o.className="vb-modal vb-hidden",o.innerHTML=`
      <div class="vb-modal-header">
        <span class="vb-modal-title">\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3092\u9001\u308B</span>
        <button class="vb-close">&times;</button>
      </div>
      <form class="vb-form">
        <input type="text" class="vb-input" name="title" placeholder="\u4F55\u3092\u6539\u5584\u3057\u3066\u307B\u3057\u3044\u3067\u3059\u304B\uFF1F" required maxlength="200" />
        <textarea class="vb-textarea" name="description" placeholder="\u8A73\u3057\u3044\u8AAC\u660E\uFF08\u4EFB\u610F\uFF09" rows="3" maxlength="2000"></textarea>
        <select class="vb-select" name="category">
          <option value="feature">\u6A5F\u80FD\u8981\u671B</option>
          <option value="bug">\u30D0\u30B0\u5831\u544A</option>
          <option value="improvement">\u6539\u5584\u63D0\u6848</option>
        </select>
        <input type="email" class="vb-input" name="email" placeholder="\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\uFF08\u4EFB\u610F\uFF09" />
        <div class="vb-honeypot"><input type="text" name="website" tabindex="-1" autocomplete="off" /></div>
        <button type="submit" class="vb-submit">\u9001\u4FE1</button>
        <div class="vb-message vb-hidden"></div>
      </form>
      <div class="vb-powered">
        <a href="https://voiceboard.app" target="_blank" rel="noopener">Powered by VoiceBoard</a>
      </div>
    `,this._shadow.appendChild(o),o.querySelector(".vb-close").addEventListener("click",()=>this._toggleModal()),o.querySelector(".vb-form").addEventListener("submit",i=>this._handleSubmit(i))},_toggleModal(){let e=this._shadow.querySelector(".vb-modal");e&&e.classList.toggle("vb-hidden")},async _handleSubmit(e){e.preventDefault();let t=e.target,o=new FormData(t);if(o.get("website"))return;let i=t.querySelector(".vb-submit"),n=t.parentElement.querySelector(".vb-message");i.disabled=!0,i.textContent="\u9001\u4FE1\u4E2D...";try{let c=await l(),r=this._config.apiBase?`${this._config.apiBase}/api/feedback`:"/api/feedback";if(!(await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:this._config.projectId,title:o.get("title"),description:o.get("description"),category:o.get("category"),email:o.get("email")||void 0,fingerprint:c})})).ok)throw new Error("Failed to submit");t.reset(),n.textContent="\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F\uFF01",n.className="vb-message vb-success",setTimeout(()=>{n.className="vb-message vb-hidden"},3e3)}catch{n.textContent="\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",n.className="vb-message vb-error"}finally{i.disabled=!1,i.textContent="\u9001\u4FE1"}}};window.VoiceBoard=p;var f=p;return x(v);})();
