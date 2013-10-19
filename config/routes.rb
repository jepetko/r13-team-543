Railsrumble::Application.routes.draw do

  resources :events, :only => [:index]

  root to: 'events#index'

end