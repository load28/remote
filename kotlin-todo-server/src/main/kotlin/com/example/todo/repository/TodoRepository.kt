package com.example.todo.repository

import com.example.todo.entity.Priority
import com.example.todo.entity.Todo
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface TodoRepository : JpaRepository<Todo, Long> {
    fun findByUserId(userId: Long, pageable: Pageable): Page<Todo>

    fun findByUserIdAndCompleted(userId: Long, completed: Boolean, pageable: Pageable): Page<Todo>

    fun findByUserIdAndPriority(userId: Long, priority: Priority, pageable: Pageable): Page<Todo>

    @Query("SELECT t FROM Todo t WHERE t.user.id = :userId AND " +
            "(:completed IS NULL OR t.completed = :completed) AND " +
            "(:priority IS NULL OR t.priority = :priority)")
    fun findByUserIdWithFilters(
        userId: Long,
        completed: Boolean?,
        priority: Priority?,
        pageable: Pageable
    ): Page<Todo>

    fun countByUserIdAndCompleted(userId: Long, completed: Boolean): Long
}
