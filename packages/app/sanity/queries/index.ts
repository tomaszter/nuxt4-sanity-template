import { defineQuery } from 'groq';
export const pageQuery = defineQuery(
  `*[_type == "page" && _id == $id][0]{_id,title,language,content,seo}`
);
