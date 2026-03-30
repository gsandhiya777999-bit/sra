let students=[];
let headers=[];
let mode="school";
let chart;

/* MODE */
function setMode(m){
 mode=m;
}

/* FILE UPLOAD */
function uploadFile(e){

const file=e.target.files[0];
const reader=new FileReader();

reader.onload=function(evt){

const data=new Uint8Array(evt.target.result);
const wb=XLSX.read(data,{type:'array'});
const ws=wb.Sheets[wb.SheetNames[0]];

const json=XLSX.utils.sheet_to_json(ws);

students=[];
headers=Object.keys(json[0]);

json.forEach(row=>{

    let obj = {...row};

    let key = headers.find(h =>
        h.toLowerCase().includes("total") ||
        h.toLowerCase().includes("score") ||
        h.toLowerCase().includes("cgpa")
    );

    obj.Score = Number(row[key]);

    students.push(obj);
});

rankStudents();
render();
drawChart();
};

reader.readAsArrayBuffer(file);
}

/* MERGE SORT */
function mergeSort(arr){
if(arr.length<=1) return arr;
let mid=Math.floor(arr.length/2);
return merge(
 mergeSort(arr.slice(0,mid)),
 mergeSort(arr.slice(mid))
);
}

function merge(a,b){
let r=[];
while(a.length&&b.length){
r.push(a[0].Score>b[0].Score?a.shift():b.shift());
}
return [...r,...a,...b];
}

/* RANK */
function rankStudents(){

students=mergeSort([...students]);

let rank=1;

students.forEach((s,i)=>{
 if(i>0 && s.Score===students[i-1].Score)
  s.Rank=students[i-1].Rank;
 else s.Rank=rank;
 rank++;
});
}

/* TABLE RENDER */
function render(){

let q = document.getElementById("search")?.value.toLowerCase() || "";  // ✅ FIXED

let head=document.getElementById("head");
let body=document.getElementById("body");

head.innerHTML="";
body.innerHTML="";

[...headers,"Score","Rank","Action"]
.forEach(h=>{
let th=document.createElement("th");
th.innerText=h;
head.appendChild(th);
});

/* FILTER */
let filterValue = document.getElementById("filterSelect").value;
let limit = students.length;

if(filterValue==="10") limit=10;
else if(filterValue==="20") limit=20;
else if(filterValue==="30") limit=30;
else if(filterValue==="custom"){
 document.getElementById("customFilter").style.display="inline";
 limit = parseInt(document.getElementById("customFilter").value) || students.length;
}else{
 document.getElementById("customFilter").style.display="none";
}

/* RENDER DATA */
students
.slice(0,limit)
.filter(s=>Object.values(s)
.join(" ")
.toLowerCase()
.includes(q))
.forEach((s,i)=>{

let tr=document.createElement("tr");

if(s.Rank==1) tr.className="gold";
else if(s.Rank==2) tr.className="silver";
else if(s.Rank==3) tr.className="bronze";

/* DATA CELLS */
headers.forEach(h=>{
let td=document.createElement("td");
td.contentEditable=true;
td.innerText=s[h] ?? "";
td.onblur=()=>update(i,h,td);
tr.appendChild(td);
});

let score=document.createElement("td");
score.innerText="✨ "+Number(s.Score).toFixed(2);
tr.appendChild(score);

let rank=document.createElement("td");
rank.innerText="🏅 "+s.Rank;
tr.appendChild(rank);

let act=document.createElement("td");
act.innerHTML=`<button onclick="del(${i})">🗑️</button>`;
tr.appendChild(act);

body.appendChild(tr);
});
}

/* UPDATE */
function update(i,key,td){
students[i][key]=td.innerText;
rankStudents();
render();
drawChart();
}

/* DELETE */
function del(i){
students.splice(i,1);
rankStudents();
render();
drawChart();
}

/* CHART */
function drawChart(){

if(students.length===0) return;

let sorted=[...students].sort((a,b)=>b.Score-a.Score);

let top5=sorted.slice(0,5);

let labels=top5.map(s=>s[headers[0]]);
let data=top5.map(s=>Number(s.Score));

let ctx=document.getElementById("topChart");

if(chart) chart.destroy();

chart=new Chart(ctx,{
type:"bar",
data:{
labels:labels,
datasets:[{
label:"Top 5 Performers",
data:data,
borderWidth:1
}]
},
options:{
responsive:true,
plugins:{
legend:{labels:{color:"white"}}
},
scales:{
x:{ticks:{color:"white"}},
y:{ticks:{color:"white"}}
}
}
});
}

/* EXPORT CSV */
function exportCSV(){
let csv=[
[...headers,"Score","Rank"],
...students.map(s=>[
...headers.map(h=>s[h]),
s.Score,
s.Rank
])
].map(r=>r.join(",")).join("\n");

let blob=new Blob([csv]);
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="ranking.csv";
a.click();
}

/* EXPORT EXCEL */
function exportExcel(){
let ws=XLSX.utils.json_to_sheet(students);
let wb=XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb,ws,"Ranking");
XLSX.writeFile(wb,"ranking.xlsx");
}

/* EXPORT PDF */
function exportPDF(){

const {jsPDF}=window.jspdf;
let doc=new jsPDF();

let cols=[...headers,"Score","Rank"];

let rows=students.map(s=>[
...headers.map(h=>s[h]),
s.Score.toFixed(2),
s.Rank
]);

doc.autoTable({
head:[cols],
body:rows
});

doc.save("ranking.pdf");
}

/* SCROLL */
function goChart(){
drawChart();
document.getElementById("topChart")
.scrollIntoView({behavior:"smooth"});
}

function goRanking(){
window.scrollTo({top:0,behavior:"smooth"});
}

/* MANUAL ADD */
function addManual(){

let name=document.getElementById("m_name").value;
let reg=document.getElementById("m_reg").value;
let score=document.getElementById("m_score").value;

if(!name||!reg||!score){
 alert("Enter all fields");
 return;
}

score=Number(score);

let obj={
 Name:name,
 RegNo:reg,
 Score:score
};

students.push(obj);

headers=["Name","RegNo"];

rankStudents();
render();
drawChart();

m_name.value="";
m_reg.value="";
m_score.value="";
}