package com.example.todo.service

import com.example.todo.dto.*
import com.example.todo.entity.Priority
import com.example.todo.entity.Todo
import com.example.todo.entity.User
import com.example.todo.repository.TodoRepository
import com.example.todo.repository.UserRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TodoService(
    private val todoRepository: TodoRepository,
    private val userRepository: UserRepository
) {

    @Transactional
    fun createTodo(email: String, request: CreateTodoRequest): TodoResponse {
        val user = findUserByEmail(email)

        val todo = Todo(
            title = request.title,
            description = request.description,
            priority = request.priority,
            dueDate = request.dueDate,
            user = user
        )

        val savedTodo = todoRepository.save(todo)
        return TodoResponse.from(savedTodo)
    }

    @Transactional(readOnly = true)
    fun getTodos(
        email: String,
        page: Int,
        size: Int,
        completed: Boolean?,
        priority: Priority?,
        sortBy: String,
        sortDir: String
    ): PageResponse<TodoResponse> {
        val user = findUserByEmail(email)

        val sort = if (sortDir.equals("desc", ignoreCase = true)) {
            Sort.by(sortBy).descending()
        } else {
            Sort.by(sortBy).ascending()
        }

        val pageable = PageRequest.of(page, size, sort)
        val todoPage = todoRepository.findByUserIdWithFilters(user.id, completed, priority, pageable)

        return PageResponse(
            content = todoPage.content.map { TodoResponse.from(it) },
            page = todoPage.number,
            size = todoPage.size,
            totalElements = todoPage.totalElements,
            totalPages = todoPage.totalPages,
            first = todoPage.isFirst,
            last = todoPage.isLast
        )
    }

    @Transactional(readOnly = true)
    fun getTodoById(email: String, todoId: Long): TodoResponse {
        val todo = findTodoAndVerifyOwnership(email, todoId)
        return TodoResponse.from(todo)
    }

    @Transactional
    fun updateTodo(email: String, todoId: Long, request: UpdateTodoRequest): TodoResponse {
        val todo = findTodoAndVerifyOwnership(email, todoId)

        todo.update(
            title = request.title,
            description = request.description,
            completed = request.completed,
            priority = request.priority,
            dueDate = request.dueDate
        )

        val updatedTodo = todoRepository.save(todo)
        return TodoResponse.from(updatedTodo)
    }

    @Transactional
    fun deleteTodo(email: String, todoId: Long) {
        val todo = findTodoAndVerifyOwnership(email, todoId)
        todoRepository.delete(todo)
    }

    @Transactional
    fun toggleComplete(email: String, todoId: Long): TodoResponse {
        val todo = findTodoAndVerifyOwnership(email, todoId)
        todo.update(
            title = null,
            description = null,
            completed = !todo.completed,
            priority = null,
            dueDate = null
        )
        val updatedTodo = todoRepository.save(todo)
        return TodoResponse.from(updatedTodo)
    }

    @Transactional(readOnly = true)
    fun getStats(email: String): TodoStatsResponse {
        val user = findUserByEmail(email)

        val completed = todoRepository.countByUserIdAndCompleted(user.id, true)
        val pending = todoRepository.countByUserIdAndCompleted(user.id, false)

        return TodoStatsResponse(
            total = completed + pending,
            completed = completed,
            pending = pending
        )
    }

    private fun findUserByEmail(email: String): User {
        return userRepository.findByEmail(email)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다") }
    }

    private fun findTodoAndVerifyOwnership(email: String, todoId: Long): Todo {
        val user = findUserByEmail(email)
        val todo = todoRepository.findById(todoId)
            .orElseThrow { IllegalArgumentException("할 일을 찾을 수 없습니다") }

        if (todo.user.id != user.id) {
            throw AccessDeniedException("이 할 일에 접근할 권한이 없습니다")
        }

        return todo
    }
}
