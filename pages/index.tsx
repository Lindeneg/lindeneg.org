import Head from "next/head";
import { generateRSS } from "../rssUtil";
import { Markdown } from "../components/Markdown";
import { PostData, loadBlogPosts, loadMarkdownFile } from "../loader";
import { PostCard } from "../components/PostCard";

const Home = (props: {
  introduction: string;
  projects: string;
  posts: PostData[];
}) => {
  return (
    <div className="content">
      <Head>
        <title>Lindeneg Homepage</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="introduction">
        <h1>Hello There</h1>
        <Markdown source={props.introduction} />
      </div>

      <div className="section">
        <h2>Sample Projects</h2>
        <div className="medium-wide">
          <Markdown source={props.projects} />
        </div>
      </div>

      <div className="section">
        <h2 className="centered"></h2>
        <a
          href="https://github.com/lindeneg?tab=repositories"
          target="_blank"
          rel="noreferrer"
        >
          <button className="fork-button">MORE PROJECTS</button>
        </a>
      </div>

      <div className="section">
        <div className="post-card-container">
          {props.posts.map((post, j) => {
            return <PostCard post={post} key={j} />;
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;

export const getStaticProps = async () => {
  const introduction = await loadMarkdownFile("introduction.md");
  const projects = await loadMarkdownFile("projects.md");
  const posts = await loadBlogPosts();

  // comment out to turn off RSS generation during build step.
  await generateRSS(posts);

  const props = {
    introduction: introduction.contents,
    projects: projects.contents,
    posts,
  };

  return { props };
};
