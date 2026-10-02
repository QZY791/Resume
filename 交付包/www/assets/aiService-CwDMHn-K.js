const E="resume-material-ai-config";const V=0,Q=1,W=[{label:"DeepSeek",baseUrl:"https://api.deepseek.com",model:"deepseek-chat"},{label:"OpenAI",baseUrl:"https://api.openai.com/v1",model:"gpt-4o-mini"},{label:"通义千问（兼容模式）",baseUrl:"https://dashscope.aliyuncs.com/compatible-mode/v1",model:"qwen-plus"}],U={baseUrl:"",apiKey:"",model:"",temperature:.3};function l(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function R(e){return e.trim().replace(/\/+$/,"")}function _(e){const t=typeof e=="number"?e:Number(e);return Number.isFinite(t)?Math.min(1,Math.max(0,t)):.3}function h(e){const t=l(e)?e:{};return{baseUrl:typeof t.baseUrl=="string"?t.baseUrl.trim():"",apiKey:typeof t.apiKey=="string"?t.apiKey.trim():"",model:typeof t.model=="string"?t.model.trim():"",temperature:_(t.temperature)}}function T(e){return e?!!e.baseUrl.trim()&&!!e.model.trim()&&!!e.apiKey.trim():!1}function N(e){const t=g()??{...U};return h({...t,...e})}function g(){try{const e=localStorage.getItem(E);return e?h(JSON.parse(e)):null}catch{return null}}function $(e){const t=h(e);try{localStorage.setItem(E,JSON.stringify(t))}catch{throw new Error("配置保存失败：浏览器本地存储不可用")}}function j(){try{localStorage.removeItem(E)}catch{}}function P(e){return e instanceof DOMException&&e.name==="AbortError"}async function k(e){let t="";try{const s=await e.text();if(s)try{const o=JSON.parse(s);if(l(o)){const i=o.error;l(i)&&typeof i.message=="string"?t=i.message:typeof o.message=="string"&&(t=o.message)}}catch{t=s}}catch{}t=t.replace(/\s+/g," ").trim().slice(0,300);const n={400:"请求被拒绝（400）：参数有误",401:"API Key 无效或无权限（401）",403:"访问被拒绝（403）",404:"接口或模型不存在（404），请检查 baseUrl 与 model",408:"服务端响应超时（408）",429:"请求过于频繁或额度不足（429）",500:"模型服务内部错误（500）",502:"网关错误（502）",503:"服务暂不可用（503）",504:"网关超时（504）"}[e.status]??`请求失败（HTTP ${e.status}）`;return t?`${n}：${t}`:n}function J(e){if(!l(e))return"";const t=e.choices;if(!Array.isArray(t)||t.length===0)return"";const r=t[0];if(!l(r))return"";const n=r.message;return l(n)&&typeof n.content=="string"?n.content:typeof r.text=="string"?r.text:""}async function b(e,t,r){const{timeoutMs:n,jsonMode:s=!1,maxTokens:o,controller:i}=r,c=i??new AbortController,d=setTimeout(()=>c.abort(),n),y=`${R(e.baseUrl)}/chat/completions`,p={model:e.model,temperature:e.temperature,messages:t};s&&(p.response_format={type:"json_object"}),typeof o=="number"&&(p.max_tokens=o);let f;try{f=await fetch(y,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e.apiKey}`},body:JSON.stringify(p),signal:c.signal})}catch(O){throw P(O)?new Error(`请求超时（超过 ${Math.round(n/1e3)} 秒），请检查网络或 baseUrl`):new Error("网络请求失败：请检查 baseUrl 是否正确、网络是否可用（部分供应商可能不允许浏览器直连，存在跨域限制）")}finally{clearTimeout(d)}if(!f.ok)throw new Error(await k(f));let x;try{x=await f.json()}catch{throw new Error("接口返回内容无法解析为 JSON")}const A=J(x).trim();if(!A)throw new Error("接口返回内容为空，请检查 model 是否可用");return A}async function C(e){const t=N(e),r=[];if(t.baseUrl||r.push("baseUrl"),t.model||r.push("model"),t.apiKey||r.push("apiKey"),r.length)return{ok:!1,msg:`请先填写：${r.join(" / ")}`};try{return await b(t,[{role:"user",content:"ping"}],{timeoutMs:15e3,maxTokens:1}),{ok:!0}}catch(n){return{ok:!1,msg:n instanceof Error?n.message:"连接失败，请检查配置"}}}const z=`你是一名资深的简历写作顾问，擅长把零散的原始经历整理成结构化的简历素材。
请严格按照用户要求，输出一个合法的 JSON 对象（不要输出 JSON 以外的任何文字）。
JSON 字段：background（背景）、objective（目标）、action（行动）、result（成果）、
skills（技能标签，string 数组）、tags（主题标签，string 数组）、quantifiedResult（量化结果，单行字符串）。
要求：
1. 基于原始笔记提炼，不虚构事实、不编造数字；
2. 成果 result 尽量量化，若原文无数据则留空而非臆造；
3. skills/tags 用简短名词短语，各 3~8 个；
4. 语言与原始笔记一致（中文输入则中文输出）。`;function G(e,t){const r=(t==null?void 0:t.trim())||"（未填写）";return`请把下面这段原始经历整理成结构化字段：

【原始笔记】
${e}

【目标岗位】（可为空）
${r}`}let u=null;function w(){u&&(u.cancelled=!0,u.controller.abort())}function K(){return u!==null}function I(e){let t=(e??"").trim();const r=t.match(/```(?:json)?\s*([\s\S]*?)```/i);r&&r[1]&&(t=r[1].trim());const n=t.indexOf("{"),s=t.lastIndexOf("}");return n!==-1&&s>n&&(t=t.slice(n,s+1)),t}function a(e){return typeof e=="string"?e.trim():typeof e=="number"||typeof e=="boolean"?String(e):Array.isArray(e)?e.map(t=>typeof t=="string"?t.trim():t==null?"":String(t)).filter(Boolean).join(`
`):""}function S(e){let t;Array.isArray(e)?t=e:typeof e=="string"?t=e.split(/[，,、;；\n]/):t=[];const r=t.map(n=>typeof n=="string"?n.trim():n==null?"":String(n).trim()).filter(Boolean);return Array.from(new Set(r))}function D(e){return{background:a(e.background),objective:a(e.objective),action:a(e.action),result:a(e.result),skills:S(e.skills),tags:S(e.tags),quantifiedResult:a(e.quantifiedResult)}}function F(e){const t=I(e);let r;try{r=JSON.parse(t)}catch{throw new Error("AI 返回格式异常（非合法 JSON），请重试")}if(!l(r))throw new Error("AI 返回格式异常（不是 JSON 对象），请重试");return D(r)}async function B(e,t={}){const r=(e??"").trim();if(!r)throw new Error("原始笔记为空，请先填写或粘贴内容");const n=g();if(!T(n))throw new Error("尚未配置大模型，请先前往「AI 设置」完成配置");w();const s=new AbortController,o={controller:s,cancelled:!1};u=o;const i=[{role:"system",content:z},{role:"user",content:G(r,t.targetPosition)}];try{const c=await b(n,i,{timeoutMs:3e4,jsonMode:!0,controller:s});return F(c)}catch(c){throw o.cancelled?new Error("已取消整理"):c}finally{u===o&&(u=null)}}const L=`你是一名资深简历写作顾问，擅长按目标岗位提炼求职者的匹配卖点。
请严格按照用户要求，输出一个合法的 JSON 对象（不要输出 JSON 以外的任何文字）。
JSON 结构：
{
  "summary": "个人总结",
  "experiences": [ { "experienceId": "必须原样回填输入中的 experienceId", "text": "该经历的精炼描述" } ]
}
要求：
1. 只基于给定素材改写，不虚构事实、不编造数字与成果；素材中没有的信息一律不写；
2. summary 聚焦目标岗位的匹配点，3~4 句，不要空话套话（如「认真负责」「学习能力强」这类无支撑的形容词）；
3. experiences 中每条经历的 text 用「背景：」「目标：」「行动：」「成果：」四个标签分行书写，
   素材中没有的部分整行省略（不要写「无」、不要留空标签）；量化结果若有，附在「成果：」行末尾；
4. experiences 必须覆盖输入的每一条经历，不新增、不遗漏，experienceId 原样回填；
5. 输出语言与【输出语言】一致（中文或英文）。`;function q(e){var s;const t=e.language==="en"?"English（英文）":"中文",r=((s=e.jobDescription)==null?void 0:s.trim())||"（未提供）",n=e.experiences.map((o,i)=>{var d;const c=(d=o.role)!=null&&d.trim()?`
   角色：${o.role.trim()}`:"";return`${i+1}. experienceId: ${o.experienceId}
   标题：${o.title}
   组织：${o.organization}${c}
   现有描述：
   ${o.star||"（暂无，请依据标题与组织给出克制的概括，不要编造细节）"}`}).join(`
`);return`请为下面这份求职材料生成简历文案。

【输出语言】
${t}

【目标岗位】
${e.targetPosition.trim()||"（未填写）"}

【岗位描述】
${r}

【个人资料摘要】
${e.profileSummary.trim()||"（未提供）"}

【经历素材】（共 ${e.experiences.length} 条，需全部覆盖）
${n||"（无）"}`}let m=null;function M(){m&&(m.cancelled=!0,m.controller.abort())}function Y(){return m!==null}function H(e,t){const r=a(e.summary),n=Array.isArray(e.experiences)?e.experiences:[],s=new Map;n.forEach((i,c)=>{var f;if(!l(i))return;const y=a(i.experienceId)||a(i.id)||((f=t.experiences[c])==null?void 0:f.experienceId)||"",p=a(i.text)||a(i.content);y&&p&&s.set(y,p)});const o=t.experiences.map(i=>({experienceId:i.experienceId,text:s.get(i.experienceId)||i.star}));return{summary:r,experiences:o}}function X(e,t){const r=I(e);let n;try{n=JSON.parse(r)}catch{throw new Error("AI 返回格式异常（非合法 JSON），请重试")}if(!l(n))throw new Error("AI 返回格式异常（不是 JSON 对象），请重试");return H(n,t)}async function Z(e){if(!e.targetPosition.trim())throw new Error("请先填写目标岗位，AI 才能按岗位生成文案");if(!e.experiences.length)throw new Error("请先勾选至少一条已确认经历");const t=g();if(!T(t))throw new Error("尚未配置大模型，请先前往「AI 设置」完成配置");M();const r=new AbortController,n={controller:r,cancelled:!1};m=n;const s=[{role:"system",content:L},{role:"user",content:q(e)}];try{const o=await b(t,s,{timeoutMs:45e3,jsonMode:!0,controller:r});return X(o,e)}catch(o){throw n.cancelled?new Error("已取消生成"):o}finally{m===n&&(m=null)}}const v={AI_CONFIG_STORAGE_KEY:E,getAIConfig:g,saveAIConfig:$,clearAIConfig:j,isAIConfigReady:T,testConnection:C,organizeExperience:B,cancelOrganize:w,isOrganizing:K,generateResume:Z,cancelGenerate:M,isGenerating:Y};export{U as E,W as P,Q as T,V as a,v as b,T as i};
