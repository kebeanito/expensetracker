package com.example.expensetracker.repository;

import com.example.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email); // check if email exists

    User findByEmail(String email); // find user by email for login
}
