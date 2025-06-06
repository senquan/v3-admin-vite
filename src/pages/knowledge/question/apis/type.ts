// 题目选项接口
export interface QuestionOption {
  _id?: number;
  question_id?: number;
  option_label: string;
  option_content: string;
  is_correct: boolean;
}

// 题目接口
export interface Question {
  _id?: number;
  category_id?: number;
  training_category?: number;
  question_type: string;
  content: string;
  difficulty?: number;
  answer?: string;
  analysis?: string;
  has_image?: boolean;
  image_path?: string;
  fits_position?: number;
  score?: number;
  source?: string;
  status?: boolean;
  creator?: number;
  create_time?: string;
  updater?: number;
  update_time?: string;
  categoryEntity?: {
    _id: number;
    name: string;
  };
  creatorEntity?: {
    _id: number;
    username: string;
  };
  updaterEntity?: {
    _id: number;
    username: string;
  };
  options?: QuestionOption[];
}

// 题库列表查询参数
export interface QuestionListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  question_type?: string;
  category_id?: number;
  difficulty?: number;
}

// 题库列表响应
export interface QuestionListResponse {
  code: number
  message: string
  data: {
    questions: Question[];
    total: number;
    page: number;
    pageSize: number;
  }
}

export interface QuestionDetailResponseData {
  code: number
  message: string
  data: Question
}

// 创建/更新题目参数
export interface CreateQuestionParams {
  category_id?: number;
  training_category?: number;
  question_type: string;
  content: string;
  difficulty?: number;
  answer?: string;
  analysis?: string;
  has_image?: boolean;
  image_path?: string;
  fits_position?: number;
  score?: number;
  source?: string;
  status?: boolean;
  options?: Omit<QuestionOption, "_id" | "question_id">[];
}

export interface UpdateQuestionParams extends CreateQuestionParams {
  _id: number;
}

// 批量删除参数
export interface BatchDeleteParams {
  ids: number[];
}

export interface QuestionActionResponseData {
  code: number
  message: string
}
