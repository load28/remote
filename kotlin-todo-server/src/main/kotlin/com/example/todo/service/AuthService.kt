package com.example.todo.service

import com.example.todo.dto.*
import com.example.todo.entity.User
import com.example.todo.repository.UserRepository
import com.example.todo.security.JwtTokenProvider
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider,
    private val authenticationManager: AuthenticationManager
) {

    @Transactional
    fun signUp(request: SignUpRequest): AuthResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw IllegalArgumentException("이미 사용 중인 이메일입니다")
        }

        val user = User(
            email = request.email,
            password = passwordEncoder.encode(request.password),
            name = request.name
        )

        val savedUser = userRepository.save(user)
        val token = jwtTokenProvider.generateToken(savedUser.email)

        return AuthResponse(
            accessToken = token,
            user = UserResponse(
                id = savedUser.id,
                email = savedUser.email,
                name = savedUser.name,
                role = savedUser.role.name
            )
        )
    }

    fun login(request: LoginRequest): AuthResponse {
        val authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(request.email, request.password)
        )

        val user = authentication.principal as User
        val token = jwtTokenProvider.generateToken(authentication)

        return AuthResponse(
            accessToken = token,
            user = UserResponse(
                id = user.id,
                email = user.email,
                name = user.name,
                role = user.role.name
            )
        )
    }

    fun getCurrentUser(email: String): UserResponse {
        val user = userRepository.findByEmail(email)
            .orElseThrow { IllegalArgumentException("사용자를 찾을 수 없습니다") }

        return UserResponse(
            id = user.id,
            email = user.email,
            name = user.name,
            role = user.role.name
        )
    }
}
