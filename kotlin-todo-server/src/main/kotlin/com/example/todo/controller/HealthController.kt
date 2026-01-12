package com.example.todo.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

@RestController
@RequestMapping("/api")
class HealthController {

    @GetMapping("/health")
    fun healthCheck(): ResponseEntity<HealthResponse> {
        return ResponseEntity.ok(
            HealthResponse(
                status = "UP",
                timestamp = LocalDateTime.now(),
                message = "Todo Server is running"
            )
        )
    }
}

data class HealthResponse(
    val status: String,
    val timestamp: LocalDateTime,
    val message: String
)
