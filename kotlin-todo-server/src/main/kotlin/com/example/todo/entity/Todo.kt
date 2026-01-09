package com.example.todo.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "todos")
class Todo(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var title: String,

    @Column(length = 1000)
    var description: String? = null,

    @Column(nullable = false)
    var completed: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var priority: Priority = Priority.MEDIUM,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    var updatedAt: LocalDateTime = LocalDateTime.now(),

    var dueDate: LocalDateTime? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User
) {
    fun update(title: String?, description: String?, completed: Boolean?, priority: Priority?, dueDate: LocalDateTime?) {
        title?.let { this.title = it }
        description?.let { this.description = it }
        completed?.let { this.completed = it }
        priority?.let { this.priority = it }
        dueDate?.let { this.dueDate = it }
        this.updatedAt = LocalDateTime.now()
    }
}

enum class Priority {
    LOW, MEDIUM, HIGH, URGENT
}
