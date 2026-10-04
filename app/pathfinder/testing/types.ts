import type { Profile } from '../../assessment/model';
import type { Journey } from '../journey';
export type TestProfile = {
  id:string; name:string; age:number; summary:string;
  expected:{goodFits:string[];poorFits:string[];notes:string};
  profile:Pick<Profile,'stage'|'educationPlan'|'targetIds'|'answers'|'specificInterests'>;
  journey:Journey;
};
