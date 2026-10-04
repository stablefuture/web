import {readFile} from "node:fs/promises";
import path from "node:path";
import {loadHecos, loadHecosReviews} from "./hecos-data";
import {currentReviews} from "./hecos-model";
import {reverseJobs, type SpotCheck} from "./reverse-model";

export async function loadReverse() {
  const [{subjects,jobs},reviews,data,eda] = await Promise.all([
    loadHecos(),loadHecosReviews(),
    readFile(path.resolve(process.cwd(),"public/assessment-careers.json"),"utf8").then(JSON.parse),
    readFile(path.resolve(process.cwd(),"../jobs/data/classified/hecos_onet_review/reverse-eda.json"),"utf8").then(JSON.parse),
  ]);
  return reverseJobs(subjects,jobs,data.units,Object.values(currentReviews(reviews,subjects)),eda.flags as SpotCheck[]);
}
