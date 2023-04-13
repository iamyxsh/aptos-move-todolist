module 0xb80d8be0093f141efb04114768b8d97ce294117833208d3c22d8bcfe33f092b9::todolist {
    use aptos_framework::account;
    use std::string::{Self, String};
    use std::table::{Self, Table};
    //use std::debug;
    use std::signer;

    struct Todolist has key {
        tasks: Table<u64, Task>,
        counter: u64
    }

    struct Task has store, copy, drop {
        id: u64,
        content: String,
        completed: bool
    }

    public entry fun create_task(account: &signer, content: String) acquires Todolist  {
        let signer_address = signer::address_of(account);
        
        if (exists<Todolist>(signer_address)) {
            let todo_list = borrow_global_mut<Todolist>(signer_address);
            let counter = todo_list.counter + 1;
            let task = Task {
               id: counter,
               content,
               completed: false 
            };

            table::upsert(&mut todo_list.tasks, counter, task);

            todo_list.counter = counter;
        } else {
            let todo_list = Todolist {
                tasks: table::new(),
                counter: 0
            };
            let task = Task {
               id: 0,
               content,
               completed: false 
            };
            table::upsert(&mut todo_list.tasks, 0, task);

            move_to(account, todo_list);
        };
    }

    public entry fun complete_task(account: &signer, id: u64) acquires Todolist {
        let signer_address = signer::address_of(account);

        assert!(exists<Todolist>(signer_address), 0);

        let todo_list = borrow_global_mut<Todolist>(signer_address);

        assert!(table::contains(&todo_list.tasks, id), 0);

        let task = table::borrow_mut(&mut todo_list.tasks, id) ;

        task.completed = true;

    }

 
    #[test(admin = @0x123)]
    fun test_create(admin: signer) acquires Todolist {
        account::create_account_for_test(signer::address_of(&admin));
        create_task(&admin, string::utf8(b"hello"));
        let todo_list = borrow_global<Todolist>(signer::address_of(&admin));
        let task = table::borrow(&todo_list.tasks, todo_list.counter);
        assert!(task.content == string::utf8(b"hello"), 0);
    }

    #[test(admin = @0x123)]
    fun test_complete(admin: signer) acquires Todolist {
        account::create_account_for_test(signer::address_of(&admin));
        create_task(&admin, string::utf8(b"hello"));
        
        complete_task(&admin, 0);
        let todo_list = borrow_global<Todolist>(signer::address_of(&admin));
        let task = table::borrow(&todo_list.tasks, todo_list.counter);

        assert!(task.completed, 0)
 
    } 
}