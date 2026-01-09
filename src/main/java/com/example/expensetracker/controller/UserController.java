package com.example.expensetracker.controller;

import com.example.expensetracker.model.User;
import com.example.expensetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*") // Allow frontend to access
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // GET all users (for admin or dropdown)
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // POST /signup - register new user
    @PostMapping("/signup")
    public ResponseEntity<User> signup(@RequestBody User user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    // POST /login - login user
    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        User user = userRepository.findByEmail(email);
        if (user != null && user.getPassword().equals(password)) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
