package com.example.todo.dto

import com.example.todo.entity.Priority
import com.example.todo.entity.Todo
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

data class CreateTodoRequest(
    @field:NotBlank(message = "제목은 필수입니다")
    @field:Size(max = 200, message = "제목은 200자 이하이어야 합니다")
    val title: String,

    @field:Size(max = 1000, message = "설명은 1000자 이하이어야 합니다")
    val description: String? = null,

    val priority: Priority = Priority.MEDIUM,

    val dueDate: LocalDateTime? = null
)

data class UpdateTodoRequest(
    @field:Size(max = 200, message = "제목은 200자 이하이어야 합니다")
    val title: String? = null,

    @field:Size(max = 1000, message = "설명은 1000자 이하이어야 합니다")
    val description: String? = null,

    val completed: Boolean? = null,

    val priority: Priority? = null,

    val dueDate: LocalDateTime? = null
)

data class TodoResponse(
    val id: Long,
    val title: String,
    val description: String?,
    val completed: Boolean,
    val priority: Priority,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val dueDate: LocalDateTime?
) {
    companion object {
        fun from(todo: Todo): TodoResponse {
            return TodoResponse(
                id = todo.id,
                title = todo.title,
                description = todo.description,
                completed = todo.completed,
                priority = todo.priority,
                createdAt = todo.createdAt,
                updatedAt = todo.updatedAt,
                dueDate = todo.dueDate
            )
        }
    }
}

data class TodoStatsResponse(
    val total: Long,
    val completed: Long,
    val pending: Long
)

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
