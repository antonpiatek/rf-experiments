use strict;
use warnings;
package RF;

# ABSTRACT: Module to interact with RF Benjie's tranceiver sketch

=head1 SYNOPSIS

  use RF;
  my $rf = RF->new;

=cut

use AnyEvent;
use AnyEvent::SerialPort;
use RF::Decoder::Debug;

use constant {
  DEBUG => $ENV{RF_DEBUG},
};

sub new {
  my $pkg = shift;
  my $self =
    bless
      {
       index => 0,
       divisor => 60,
       serial_port => '/dev/ttyACM0',
       baudrate => 57600,
       message_cb => sub {
         print STDERR "Got: @_\n" if DEBUG;
       },
       started_cb => sub {
         print STDERR "Capture started: @_\n" if DEBUG;
       },
       recognizers => [ RF::Decoder::Debug->new ],
       @_
      }, $pkg;
  $self->connect unless (defined $self->{handle});
  $self
}

sub stop_capture {
  my ($self, $cb) = @_;
  $self->{handle}->push_write('C');
  $self->{handle}->on_drain(sub {
                              my ($hdl) = @_;
                              $hdl->shutdown;
                              $cb->() if (defined $cb);
                            });
}

sub start_capture {
  my ($self, $cb) = @_;
  $cb //= $self->{started_cb};
  $self->{handle}->push_write('D'.chr($self->{divisor}).'c');
  $self->{handle}->on_drain(sub { $cb->() }) if (defined $cb);
}

sub connect {
  my ($self, $cb) = @_;
  $cb //= sub {
    print STDERR "Initializing capture\n" if DEBUG;
    delete $self->{connect_wait};
    $self->start_capture;
  };
  my $hdl = $self->{handle} =
    AnyEvent::SerialPort->new(serial_port => [ $self->{serial_port},
                                               [ $self->{baudrate} => 57600 ],
                                             ]);
  $hdl->on_read(sub {
                  my ($h) = @_;
                  $h->push_read(chunk => 1, sub {
                                  $self->recognize(@_);
                                  undef $self;
                                });
                });
  my $w;
  $self->{connect_wait} = AnyEvent->timer(after => 2, cb => $cb);
}

sub recognize {
  my ($self, $handle, $data) = @_;
  if ($self->{log_fh}) {
    my $fh = $self->{log_fh};
    print $fh $data;
  }
  my $value = unpack 'C', $data;
  $value *= $self->{divisor};
  foreach my $r (@{$self->{recognizer}}) {
    $r->recognize($value, $self->{index}, $self->{message_cb});
  }
  $self->{index}++;
}

1;
