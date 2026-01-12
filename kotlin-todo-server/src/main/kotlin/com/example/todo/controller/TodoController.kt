package com.example.todo.controller

import com.example.todo.dto.*
import com.example.todo.entity.Priority
import com.example.todo.service.TodoService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/todos")
class TodoController(
    private val todoService: TodoService
) {

    @PostMapping
    fun createTodo(
        @AuthenticationPrincipal userDetails: UserDetails,
        @Valid @RequestBody request: CreateTodoRequest
    ): ResponseEntity<TodoResponse> {
        val response = todoService.createTodo(userDetails.username, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @GetMapping
    fun getTodos(
        @AuthenticationPrincipal userDetails: UserDetails,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @RequestParam(required = false) completed: Boolean?,
        @RequestParam(required = false) priority: Priority?,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String
    ): ResponseEntity<PageResponse<TodoResponse>> {
        val response = todoService.getTodos(
            userDetails.username,
            page,
            size,
            completed,
            priority,
            sortBy,
            sortDir
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    fun getTodoById(
        @AuthenticationPrincipal userDetails: UserDetails,
        @PathVariable id: Long
    ): ResponseEntity<TodoResponse> {
        val response = todoService.getTodoById(userDetails.username, id)
        return ResponseEntity.ok(response)
    }

    @PutMapping("/{id}")
    fun updateTodo(
        @AuthenticationPrincipal userDetails: UserDetails,
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateTodoRequest
    ): ResponseEntity<TodoResponse> {
        val response = todoService.updateTodo(userDetails.username, id, request)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/{id}")
    fun deleteTodo(
        @AuthenticationPrincipal userDetails: UserDetails,
        @PathVariable id: Long
    ): ResponseEntity<Void> {
        todoService.deleteTodo(userDetails.username, id)
        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/{id}/toggle")
    fun toggleComplete(
        @AuthenticationPrincipal userDetails: UserDetails,
        @PathVariable id: Long
    ): ResponseEntity<TodoResponse> {
        val response = todoService.toggleComplete(userDetails.username, id)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/stats")
    fun getStats(
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<TodoStatsResponse> {
        val response = todoService.getStats(userDetails.username)
        return ResponseEntity.ok(response)
    }
}
