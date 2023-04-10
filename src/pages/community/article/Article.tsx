import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { FaRegThumbsUp, FaThumbsUp, FaRegComment } from 'react-icons/fa';
import ArticleMenu from '../articleMenu/ArticleMenu';
import Share from './Share';
import CommentInput from './comment/CommentInput';
import CommentList from './comment/CommentList';
import Login from '../../login/Login';
import { BASE_URL, HEADERS } from '../../../config';
import { useSetRecoilState, useRecoilState } from 'recoil';
import { categoryState, commentOption } from '../../../atom';
import { ArticleData, CommentData, UserData } from '../../../../@types/Article';
import './Article.scss';

function Article() {
  console.log('부모컴포넌트 article');
  const [currentArticle, setCurrentArticle] = useState<ArticleData[]>([]);
  const [article] = currentArticle;
  const [isCheckLikes, setIsCheckLikes] = useState<boolean>(false);
  const [likes, setLikes] = useState<number>(0);
  const [commentList, setCommentList] = useState<CommentData[]>([]);
  const [userInfo, setUserInfo] = useState<UserData[]>([]);
  const [user] = userInfo;
  const [activeLogin, setActiveLogin] = useState<boolean>(false);
  const checkActiveCategory = useSetRecoilState(categoryState);
  const [currentTab, setCurrentTab] = useRecoilState(commentOption);

  const commentNum = commentList.length;
  const reCommentNum = commentList
    .map(x => x.reComments.length)
    .reduce((a, b) => a + b, 0);
  const navi = useNavigate();
  const params = useParams<string>();
  const postId = params.id;

  // 게시글 조회
  const fetchArticle = () => {
    // console.log('fetArti');
    axios
      .get(`${BASE_URL}/community/posts/${postId}`, HEADERS)
      .then(res => {
        setCurrentArticle([res.data]);
        setIsCheckLikes(res.data.ifLiked);
        setLikes(res.data.likes === null ? 0 : res.data.likes.length);
        checkActiveCategory(currentArticle[0]?.subCategoryId);
      })
      .catch(err => {
        if (err?.response.status === 500) {
          navi('/noArticle');
        }
      });
  };

  // 댓글 조회
  const fetchComment = async () => {
    // console.log('fetCom');
    await axios
      .get(`${BASE_URL}/community/posts/${postId}/comments`, HEADERS)
      .then(res => {
        setCommentList(res.data.reverse());
      });
  };

  // 유저 정보 조회
  const fetchUser = async () => {
    // console.log('fetUser');
    await axios
      .get(`${BASE_URL}/user`, HEADERS)
      .then(res => setUserInfo([res.data]));
  };

  // 로그인으로 이동
  const openLogin = (): void => {
    setActiveLogin(true);
  };

  const handleLogin = () => {
    localStorage.setItem('referrer', window.location.href);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_GITHUB_REST_API_KEY}&redirect_uri=https://let-s-git-it.vercel.app/githublogin`;
  };

  // 게시글 좋아요
  const clickThumbsUp = () => {
    axios
      .post(
        `${BASE_URL}/community/like`,
        {
          postId: postId,
        },
        HEADERS
      )
      .then(res => {
        fetchArticle();
      })
      .catch(err => {
        if (!article.isLogin) {
          alert('로그인이 필요한 서비스입니다');
          if (window.screen.width > 480) {
            openLogin();
          } else {
            handleLogin();
          }
        }
      });
  };

  // 게시글 삭제하기
  const deleteArticle = () => {
    let text = `[${article.postTitle}] 글을 삭제하시겠습니까?`;
    if (window.confirm(text)) {
      axios
        .delete(`${BASE_URL}/community/posts/${postId}`, HEADERS)
        .then(res => {
          alert('정상적으로 삭제되었습니다');
          navi('/articleList/4?offset=0&limit=10&sort=latest');
        })
        .catch(err => console.log(err));
    }
  };

  // 게시글 수정
  const editArticle = () => {
    navi(`/articleModify/${postId}`);
  };

  // 게시글 작성자 페이지 이동
  const goToWriterProfile = () => {
    navi(`/userdetail/${article.userName}`);
  };

  useEffect(() => {
    fetchArticle();
    fetchComment();
    fetchUser();
    setCurrentTab(0);
  }, []);

  return (
    article && (
      <div className="articlePage">
        <main className="listAndArticle">
          <aside className="listWrap">
            <ArticleMenu />
          </aside>
          <article className="articleWrap">
            <header className="headerWrap">
              <article className="titleWrap">
                <h1 className="title">{article.postTitle}</h1>
                <ul className={article.isAuthor ? 'editDel' : 'hidden'}>
                  <li className="edit" onClick={editArticle}>
                    수정
                  </li>
                  <li className="del" onClick={deleteArticle}>
                    삭제
                  </li>
                </ul>
              </article>
              <article className="titleInner">
                <ul>
                  <li className="category">{article.subCategoryName}</li>
                  <li className="slash1">|</li>
                  <li>{article.createdAt.slice(0, 10)}</li>
                  <li className="slash2">|</li>
                  <img
                    src={`../image/${article.tierName}.png`}
                    className="tier"
                    alt="tier"
                  />
                  <li className="writer" onClick={goToWriterProfile}>
                    {article.userName}
                  </li>
                </ul>
              </article>
            </header>
            <article className="mainWrap">
              <div className="article">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>
              <section className="mainBottom">
                <div className="thumsCommentIcons">
                  <div className="thumbsUpWrap">
                    {isCheckLikes ? (
                      <FaThumbsUp
                        className="thumbsUp"
                        onClick={clickThumbsUp}
                      />
                    ) : (
                      <>
                        <FaRegThumbsUp
                          className="thumbsUp"
                          onClick={clickThumbsUp}
                        />
                        <Login
                          active={activeLogin}
                          setActiveLogin={setActiveLogin}
                        />
                      </>
                    )}
                    <span>{likes}</span>
                  </div>
                  <div className="commentIconWrap">
                    <FaRegComment />
                    <span>{commentNum + reCommentNum}</span>
                  </div>
                </div>
                <Share
                  postTitle={article.postTitle}
                  createdAt={article.createdAt}
                  userName={article.userName}
                />
              </section>
            </article>
            <CommentInput
              userName={user?.userName}
              profileImg={user?.profileImageUrl}
              tier={user?.tierName}
              isLogin={article.isLogin}
              commentNum={commentNum}
              groupOrder={commentList[0]?.groupOrder}
              fetchComment={fetchComment}
            />
            <CommentList
              commentList={
                currentTab === 0
                  ? commentList
                  : [...commentList].sort((a, b) => b.likeNumber - a.likeNumber)
              }
              fetchArticle={fetchArticle}
              fetchComment={fetchComment}
            />
          </article>
        </main>
      </div>
    )
  );
}

export default Article;
