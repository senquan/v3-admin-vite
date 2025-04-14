<script lang="ts" setup>
import { ref, computed } from 'vue'
import TodoItem from './TodoItem.vue'
import { toggleTodo as toggleTodoStatus } from "@/pages/todolist/apis"

const STORAGE_KEY = 'todos'

interface Todo {
  id: number;
  name: string;
  isDone: boolean;
  endtime?: string;
  [key: string]: any;
}

const props = defineProps({
  data: {
    type: Array as () => Todo[],
    default: () => []
  }
})

// 当前选中的过滤器
const activeFilter = ref<'all' | 'active' | 'completed'>('all')

const filters = computed(() => ({
  all: props.data,
  active: props.data.filter((todo: Todo) => !todo.isDone),
  completed: props.data.filter((todo: Todo) => todo.isDone)
}))

// 当前过滤后的列表
const filteredTodos = computed(() => {
  return filters.value[activeFilter.value] || []
})

// 切换完成状态
const toggleTodo = (todo: Todo) => {
  todo.isDone = !todo.isDone
  toggleTodoStatus(todo.id).then(() => {
    setLocalStorage()
  })
}

const setLocalStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(props.data))
}
</script>

<template>
  <div>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <div class="card-title">
            <Edit style="width: 1.5em; height: 1.5em; margin-right: 5px" />
            <span>待办事项</span>
          </div>
          <el-radio-group v-model="activeFilter" size="small">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="active">未完成</el-radio-button>
            <el-radio-button value="completed">已完成</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-scrollbar height="300px">
        <div v-if="filteredTodos.length === 0" class="empty-tip">
          暂无待办事项
        </div>
        <div
          v-for="todo in filteredTodos"
          :key="todo.id"
          class="todolist-item"
          :class="{ 'is-completed': todo.isDone }"
        >
          <TodoItem :todo="todo" @toggleTodo="toggleTodo" />
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<style scoped>
.box-card {
  font: 14px 'Helvetica Neue', Helvetica, Arial, sans-serif;
  width: 100%;
  height: 100%;
  line-height: 1.4em;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
}
:deep(.el-card__header) {
  padding: 10px;
}
.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.todolist-item {
  display: flex;
  align-items: center;
  padding: 3px;
  margin-bottom: 5px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  transition: all 0.3s;
}

.todolist-item.is-completed {
  background: #f5f7fa;
  color: #909399;
  text-decoration: line-through;
}

.todo-text {
  margin-left: 10px;
  flex: 1;
}

.todo-date {
  font-size: 12px;
  color: #909399;
}
</style>