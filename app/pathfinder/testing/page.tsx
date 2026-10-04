import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import TestLab from './TestLab';
export const metadata:Metadata={title:'Pathfinder testing | Stable Future',robots:{index:false,follow:false}};
export default function TestingPage(){
  if(process.env.NODE_ENV==='production')notFound();
  return <TestLab/>;
}
